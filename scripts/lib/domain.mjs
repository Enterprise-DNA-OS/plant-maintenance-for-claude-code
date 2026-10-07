import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {REPO_ROOT} from './db.mjs';
import {importMex} from './import.mjs';
export const entities=['assets','schedules','work_orders','meters','spares','stock_moves','inspections','purchase_requests','notes','audit_log'];
export const reads={
assets:'select id,code,name,site,criticality,status from assets order by code',
'work-orders':'select * from backlog order by due_date,code',
'pm-due':'select * from pm_due order by next_due,asset',
'maintenance-round':'select * from pm_due order by next_due,asset',
stores:'select * from stock_attention order by code',
spares:'select id,code,name,quantity,reorder_level,currency from spares order by code',
meters:'select a.code as asset,m.reading,m.unit,m.observed_at,m.recorded_by from meters m join assets a on a.id=m.asset_id order by m.observed_at desc',
inspections:'select * from inspection_status order by code',
schedules:'select s.*,a.code as asset from schedules s join assets a on a.id=s.asset_id order by a.code,s.name',
'purchase-requests':'select p.*,s.code as spare from purchase_requests p join spares s on s.id=p.spare_id order by p.created_at',
'reliability':'select * from asset_reliability order by downtime_minutes desc,code',
'attention':"select code,asset,title,status,days_overdue,assigned_to from backlog where days_overdue>0 or assigned_to is null or status='waiting_parts' order by days_overdue desc,code",
'critical-backlog':"select code,asset,title,site,days_overdue from backlog where criticality='high' order by days_overdue desc,code",
'stale-work':"select w.code,a.code as asset,w.title,w.status,w.updated_at from work_orders w join assets a on a.id=w.asset_id where w.status<>'completed' and w.updated_at<now()-interval '14 days' order by w.updated_at",
'parts-wait':"select code,asset,title,days_overdue from backlog where status='waiting_parts' order by days_overdue desc",
'crew-load':"select coalesce(assigned_to,'Unassigned') as person,count(*) as open_jobs,count(*) filter(where days_overdue>0) as overdue from backlog group by assigned_to order by open_jobs desc,person",
'site-review':"select site,count(*) as open_jobs,count(*) filter(where days_overdue>0) as overdue from backlog group by site order by site",
'cost-review':"select a.code as asset,m.currency,sum(-m.quantity*m.unit_cost_cents)/100 as parts_cost from stock_moves m join work_orders w on w.id=m.work_order_id join assets a on a.id=w.asset_id where m.quantity<0 group by a.code,m.currency order by a.code,m.currency",
'history':"select w.code,a.code as asset,w.title,w.completed_by,w.completed_at,w.completion_note,w.labour_minutes,w.downtime_minutes from work_orders w join assets a on a.id=w.asset_id where w.status='completed' order by w.completed_at desc",
'audit':'select entity,record_id,action,actor,detail,created_at from audit_log order by created_at desc',
'activity':'select a.code as asset,n.actor,n.note,n.created_at from notes n join assets a on a.id=n.asset_id order by n.created_at desc'
};
export const writeCommands=['add','assign','set-status','complete','generate-pm','meter','inspect','stock','issue','request-parts','receive','log','draft-work-order','draft-reorder','import','export'];
export const commands=['help',...Object.keys(reads),'asset','compliance','weekly-review',...writeCommands];
const required=(v,label)=>{if(v===undefined||v===null||!String(v).trim())throw Error(`${label} is required`);return String(v).trim()};
const number=(v,label,{integer=false,positive=false}={})=>{required(v,label);const n=Number(v);if(!Number.isFinite(n)||n<0||(positive&&n===0)||(integer&&!Number.isInteger(n)))throw Error(`Invalid ${label}`);return n};
export function date(v){const s=required(v,'date');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('Use a valid YYYY-MM-DD date');return s}
export async function resolve(db,entity,term){if(!entities.includes(entity))throw Error('Unknown entity');const key=required(term,entity);const label=['assets','spares'].includes(entity)?'name':entity==='schedules'?'name':entity==='work_orders'?'title':'id::text';const code=['assets','spares','work_orders'].includes(entity)?'code':'id::text';const rows=await db.query(`select *, ${label} as match_name from ${entity} where lower(${code})=lower($1) or lower(${label})=lower($1) or id::text like $2 order by id`,[key,key+'%']);if(rows.length!==1)throw Error(`${entity}: ${rows.length?'ambiguous':'no match'} ${key}\n`+rows.map(r=>`${r.id} ${r.code||''} ${r.match_name}`).join('\n'));return rows[0]}
export async function transaction(db,fn){await db.exec('BEGIN');try{const value=await fn();await db.exec('COMMIT');return value}catch(e){await db.exec('ROLLBACK');throw e}}
async function audit(db,entity,id,action,actor,detail){await db.query('insert into audit_log(entity,record_id,action,actor,detail) values($1,$2,$3,$4,$5)',[entity,id,action,required(actor,'actor'),JSON.stringify(detail)])}
async function insert(db,entity,fields,actor){const keys=Object.keys(fields);const [row]=await db.query(`insert into ${entity}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1))}) returning *`,Object.values(fields));await audit(db,entity,row.id,'add',actor,fields);return row}
export async function compliance(db){const rows=await db.query('select * from inspection_status order by code');const findings=[];for(const a of rows){const push=(rule,finding)=>findings.push({asset:a.code,rule,finding});if(!a.instruction_ref)push('PLANT-01','No maintenance instruction reference');if(a.registration_required&&!a.registration_ref)push('PLANT-02','Registration evidence missing');if(!a.inspected_on)push('PLANT-03','No recorded inspection');else if(a.next_due<new Date().toISOString().slice(0,10))push('PLANT-03','Recorded inspection due date passed');if(a.result==='defect')push('PLANT-04','Latest inspection records a defect');}return findings}
export async function run(db,command,args=[],o={}){
if(command==='help')return commands.map(command=>({command}));
if(reads[command])return db.query(reads[command]);
if(command==='compliance')return compliance(db);
if(command==='weekly-review')return {attention:await run(db,'attention'),maintenance:await run(db,'pm-due'),stores:await run(db,'stores'),compliance:await compliance(db)};
if(command==='asset'){const a=await resolve(db,'assets',args[0]);return {asset:a,work:await db.query('select * from work_orders where asset_id=$1 order by created_at',[a.id]),inspections:await db.query('select * from inspections where asset_id=$1 order by inspected_on',[a.id]),notes:await db.query('select * from notes where asset_id=$1 order by created_at',[a.id])}}
if(command==='import'){if(args[0]!=='mex')throw Error('Usage: import mex <assets.csv> [--mapping=file] [--dry-run]');return importMex(db,args[1],o)}
if(command==='export'){const out=path.resolve(o.out||path.join(REPO_ROOT,'exports',`plant-${randomUUID()}.json`));const data=await transaction(db,async()=>{await db.exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');const data={format:'plant-maintenance-v1',exported_at:new Date().toISOString()};for(const entity of entities)data[entity]=await db.query(`select * from ${entity} order by id`);return data});fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(data,null,2),{flag:'wx'});return {file:out,records:entities.reduce((n,k)=>n+data[k].length,0)}}
if(command.startsWith('draft-')){let data,title;if(command==='draft-work-order'){data=await resolve(db,'work_orders',args[0]);title=`Work order ${data.code}`;}else if(command==='draft-reorder'){data=await run(db,'stores');title='Parts reorder request';}else throw Error('Unknown draft command');const dir=path.resolve(o.out||path.join(REPO_ROOT,'drafts'));fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`${command}-${randomUUID()}.md`);fs.writeFileSync(file,`# DRAFT: ${title}\n\nReview before use. No order placed and no message sent.\n\n`+JSON.stringify(data,null,2));return {file}}
if(!writeCommands.includes(command))throw Error(`Unknown command ${command}. Use help.`);
return transaction(db,async()=>{
const actor=required(o.actor,'--actor');
if(command==='add'){
 const entity=args[0];let f;
 if(entity==='asset')f={code:required(o.code,'code'),name:required(o.name,'name'),site:required(o.site,'site'),criticality:o.criticality||'medium',instruction_ref:o.instruction||null,registration_required:o['registration-required']===true,registration_ref:o.registration||null};
 else if(entity==='work-order'){const a=await resolve(db,'assets',o.asset);if(a.status==='retired')throw Error('Retired asset');f={code:required(o.code,'code'),asset_id:a.id,title:required(o.title,'title'),due_date:date(o.due),priority:o.priority||'normal',assigned_to:o.assignee||null,isolation_ref:o.isolation||null}}
 else if(entity==='schedule'){const a=await resolve(db,'assets',o.asset);f={asset_id:a.id,name:required(o.name,'name'),interval_days:number(o.days,'days',{positive:true,integer:true}),next_due:date(o.due),instruction_ref:required(o.instruction,'instruction'),meter_interval:o['meter-interval']===undefined?null:number(o['meter-interval'],'meter interval',{positive:true}),next_meter:o['next-meter']===undefined?null:number(o['next-meter'],'next meter')}}
 else if(entity==='spare')f={code:required(o.code,'code'),name:required(o.name,'name'),location:required(o.location,'location'),quantity:0,reorder_level:number(o.reorder||0,'reorder'),unit_cost_cents:number(o.cents||0,'cents',{integer:true}),currency:o.currency||'AUD'};
 else throw Error('add asset|work-order|schedule|spare');
 return insert(db,({asset:'assets','work-order':'work_orders',schedule:'schedules',spare:'spares'})[entity],f,actor);
}
if(command==='generate-pm'){const due=await db.query('select s.*,a.status as asset_status from schedules s join assets a on a.id=s.asset_id where s.id in (select id from pm_due where date_due or meter_due) order by s.id for update of s');const out=[];for(const s of due){if((await db.query("select id from work_orders where schedule_id=$1 and status<>'completed'",[s.id])).length)continue;out.push(await insert(db,'work_orders',{code:'PM-'+randomUUID().slice(0,12),asset_id:s.asset_id,schedule_id:s.id,title:s.name,kind:'preventive',due_date:s.next_due},actor))}return out}
if(['assign','set-status','complete'].includes(command)){
 const w=await resolve(db,'work_orders',args[0]);await db.query('select id from work_orders where id=$1 for update',[w.id]);const [current]=await db.query('select * from work_orders where id=$1',[w.id]);if(current.status==='completed')throw Error('Completed work order is locked');
 let rows;
 if(command==='assign')rows=await db.query('update work_orders set assigned_to=$1 where id=$2 returning *',[required(o.person,'person'),w.id]);
 if(command==='set-status'){if(!['open','in_progress','waiting_parts'].includes(o.status))throw Error('Use open, in_progress or waiting_parts');rows=await db.query('update work_orders set status=$1 where id=$2 returning *',[o.status,w.id])}
 if(command==='complete'){
 const note=required(o.note,'completion note');const isolation=required(o.isolation,'isolation evidence or approved procedure reference');
 rows=await db.query("update work_orders set status='completed',completed_at=now(),completed_by=$1,completion_note=$2,isolation_ref=$3,labour_minutes=$4,downtime_minutes=$5 where id=$6 returning *",[actor,note,isolation,number(o.labour||0,'labour',{integer:true}),number(o.downtime||0,'downtime',{integer:true}),w.id]);
 if(w.schedule_id)await db.query('update schedules set next_due=current_date+interval_days, next_meter=case when meter_interval is null then null else greatest(next_meter,coalesce((select max(reading) from meters where asset_id=schedules.asset_id),0))+meter_interval end where id=$1',[w.schedule_id]);
 }
 await audit(db,'work_orders',w.id,command,actor,o);return rows[0];
}
if(command==='meter'){const a=await resolve(db,'assets',args[0]);await db.query('select id from assets where id=$1 for update',[a.id]);const n=number(o.reading,'reading');const [last]=await db.query('select max(reading) as reading from meters where asset_id=$1',[a.id]);if(last.reading!==null&&n<Number(last.reading))throw Error('Meter cannot go backwards; record a reviewed meter replacement migration');return insert(db,'meters',{asset_id:a.id,reading:n,recorded_by:actor},actor)}
if(command==='inspect'){const a=await resolve(db,'assets',args[0]);const on=date(o.on);if(on>new Date().toISOString().slice(0,10))throw Error('Inspection cannot be in the future');const row=await insert(db,'inspections',{asset_id:a.id,inspected_on:on,next_due:date(o.due),inspector:actor,competency_ref:required(o.competency,'competency'),evidence_ref:required(o.evidence,'evidence'),result:required(o.result,'result'),finding:required(o.finding,'finding')},actor);if(o.result==='defect')await db.query("update assets set status='held' where id=$1",[a.id]);return row}
if(['stock','issue','request-parts','receive'].includes(command)){
 let s,pr;if(command==='receive'){pr=await resolve(db,'purchase_requests',args[0]);await db.query('select id from purchase_requests where id=$1 for update',[pr.id]);[pr]=await db.query('select * from purchase_requests where id=$1',[pr.id]);if(pr.status==='received')throw Error('Already received');s=await resolve(db,'spares',pr.spare_id)}else s=await resolve(db,'spares',args[0]);
 await db.query('select id from spares where id=$1 for update',[s.id]);[s]=await db.query('select * from spares where id=$1',[s.id]);const qty=command==='receive'?Number(pr.quantity):number(o.quantity,'quantity',{positive:true});const reason=required(o.reason,'reason');
 if(command==='request-parts')return insert(db,'purchase_requests',{spare_id:s.id,quantity:qty,requested_by:actor,reason},actor);
 let work=null;if(command==='issue'){work=await resolve(db,'work_orders',o.work);await db.query('select id from work_orders where id=$1 for update',[work.id]);[work]=await db.query('select * from work_orders where id=$1',[work.id]);if(work.status==='completed')throw Error('Completed work order is locked');if(qty>Number(s.quantity))throw Error('Insufficient stock')}
 const delta=command==='issue'?-qty:qty;await db.query('update spares set quantity=quantity+$1 where id=$2',[delta,s.id]);const move=await insert(db,'stock_moves',{spare_id:s.id,work_order_id:work?.id||null,quantity:delta,reason,actor,unit_cost_cents:s.unit_cost_cents,currency:s.currency},actor);
 if(pr){await db.query("update purchase_requests set status='received',received_at=now() where id=$1",[pr.id]);await audit(db,'purchase_requests',pr.id,'receive',actor,{move:move.id})}return move;
}
if(command==='log'){const a=await resolve(db,'assets',args[0]);return insert(db,'notes',{asset_id:a.id,actor,note:required(o.note,'note')},actor)}
throw Error('Unsupported action');
});
}
