#!/usr/bin/env node
import {getDb} from './lib/db.mjs';
import {run} from './lib/domain.mjs';
import {table} from './lib/format.mjs';
const positional=[],options={};for(const arg of process.argv.slice(2)){if(arg.startsWith('--')){const i=arg.indexOf('=');options[arg.slice(2,i<0?undefined:i)]=i<0?true:arg.slice(i+1)}else positional.push(arg)}
function human(value){if(Array.isArray(value)){if(!value.length)return '(none)';const columns=Object.keys(value[0]).filter(k=>!['id','asset_id','schedule_id','source_data','instruction_ref'].includes(k));return table(value,columns.map(key=>({key,label:key.replaceAll('_',' '),width:42,format:v=>v===null?'':typeof v==='object'?JSON.stringify(v):String(v)})))}return Object.entries(value).map(([k,v])=>`${k}\n${typeof v==='object'&&v!==null?human(Array.isArray(v)?v:[v]):v}`).join('\n\n')}
let db;try{db=await getDb();const value=await run(db,positional[0]||'help',positional.slice(1),options);console.log(options.json?JSON.stringify(value,null,2):human(value));}catch(e){console.error(options.json?JSON.stringify({error:e.message}):e.message);process.exitCode=1}finally{await db?.close()}
