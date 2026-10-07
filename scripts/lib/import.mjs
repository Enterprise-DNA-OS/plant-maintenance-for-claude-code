import fs from 'node:fs';
import {parse} from 'csv-parse/sync';
export async function importMex(db,file,o={}){
 if(!file)throw Error('CSV file required');
 const rows=parse(fs.readFileSync(file,'utf8'),{bom:true,skip_empty_lines:true,trim:true});
 if(rows.length<2)throw Error('CSV needs a header and at least one record');
 const headers=rows.shift();if(new Set(headers.map(x=>x.toLowerCase())).size!==headers.length)throw Error('Duplicate headers');
 const aliases={code:['Asset Number','Asset No','Asset Code','Asset ID'],name:['Asset Description','Asset Name','Description'],site:['Location','Site'],criticality:['Criticality']};
 const mapping=o.mapping?JSON.parse(fs.readFileSync(o.mapping,'utf8')):{};
 for(const [key,column] of Object.entries(mapping))if(!Object.hasOwn(aliases,key)||!headers.includes(column))throw Error(`Invalid mapping ${key}: ${column}`);
 const indexes={};for(const [key,names] of Object.entries(aliases)){const hits=mapping[key]?[headers.indexOf(mapping[key])]:headers.map((h,i)=>names.some(a=>a.toLowerCase()===h.toLowerCase())?i:-1).filter(i=>i>=0);if(hits.length>1)throw Error(`Ambiguous ${key} columns; provide mapping`);indexes[key]=hits[0]??-1;}
 for(const key of ['code','name'])if(indexes[key]<0)throw Error(`Missing ${key} column; provide --mapping`);
 const seen=new Set();const prepared=rows.map((row,i)=>{const get=k=>indexes[k]<0?'':row[indexes[k]];const code=get('code'),name=get('name');if(!code||!name)throw Error(`Row ${i+2}: code and name required`);if(seen.has(code.toLowerCase()))throw Error(`Duplicate asset ${code}`);seen.add(code.toLowerCase());const criticality=get('criticality').toLowerCase()||'medium';if(!['low','medium','high'].includes(criticality))throw Error(`Row ${i+2}: map criticality before import`);return {code,name,site:get('site')||'Unassigned',criticality,source_data:Object.fromEntries(headers.map((h,j)=>[h,row[j]]))}});
 await db.exec('BEGIN');try{
 // Asset-only imports retain existing safety evidence and operational history.
 for(const a of prepared){const matches=await db.query('select code from assets where lower(code)=lower($1)',[a.code]);if(matches.some(x=>x.code!==a.code))throw Error(`Case-conflicting asset code ${a.code}`);}
 if(o['dry-run']){await db.exec('ROLLBACK');return {dry_run:true,assets:prepared.length,records:prepared.map(({source_data,...a})=>a)}}
 if(!o.actor||!String(o.actor).trim())throw Error('--actor is required');
 for(const a of prepared){const [saved]=await db.query(`insert into assets(code,name,site,criticality,source_data) values($1,$2,$3,$4,$5) on conflict(code) do update set name=excluded.name,site=excluded.site,criticality=excluded.criticality,source_data=excluded.source_data returning id`,[a.code,a.name,a.site,a.criticality,JSON.stringify(a.source_data)]);await db.query("insert into audit_log(entity,record_id,action,actor,detail) values('assets',$1,'import-mex',$2,$3)",[saved.id,o.actor,JSON.stringify({code:a.code})]);}
 await db.exec('COMMIT');return {imported:prepared.length,scope:'Asset register only; existing work and safety evidence retained'};
 }catch(e){await db.exec('ROLLBACK');throw e}
}
