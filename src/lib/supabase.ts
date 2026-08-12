import { createClient,type RealtimeChannel,type SupabaseClient } from '@supabase/supabase-js'
import { getMaterials,getReferences,getSettings,getTasks,normalizeMaterial,normalizeReference,normalizeSettings,normalizeTask,saveMaterials,saveReferences,saveSettings,saveTasks,validDate } from './storage'
import type { AppData,Material,ReferenceItem,Task,UserSettings } from '../types'

export type CollectionKind='tasks'|'materials'|'references'
type Tombstone={kind:CollectionKind;id:string;deletedAt:string}
const TOMBSTONES_KEY='kelasku_pending_deletes'
const url=import.meta.env.VITE_SUPABASE_URL?.trim(),key=import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
export const supabase:SupabaseClient|null=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}):null
export const cloudConfigured=()=>Boolean(supabase)
export const localSnapshot=():AppData=>({tasks:getTasks(),materials:getMaterials(),references:getReferences(),settings:getSettings()})

function readTombstones():Tombstone[]{
  try{return JSON.parse(localStorage.getItem(TOMBSTONES_KEY)||'[]').filter((x:unknown):x is Tombstone=>Boolean(x&&typeof x==='object'&&['tasks','materials','references'].includes((x as Tombstone).kind)&&typeof (x as Tombstone).id==='string'))}catch{return []}
}
function saveTombstones(value:Tombstone[]){localStorage.setItem(TOMBSTONES_KEY,JSON.stringify(value))}
export function queueDeletes(kind:CollectionKind,ids:string[]){
  if(!ids.length)return
  const queued=readTombstones(),now=new Date().toISOString(),keys=new Set(queued.map(x=>`${x.kind}:${x.id}`))
  for(const id of ids)if(id&&!keys.has(`${kind}:${id}`))queued.push({kind,id,deletedAt:now})
  saveTombstones(queued)
}
export async function deleteRow(kind:CollectionKind,id:string){
  if(!supabase)throw new Error('Supabase belum dikonfigurasi; penghapusan disimpan dalam antrean lokal.')
  const{error}=await supabase.from(kind).delete().eq('id',id)
  if(error)throw error
}
export async function flushPendingDeletes(){
  const queued=readTombstones()
  if(!queued.length)return
  if(!supabase)throw new Error('Supabase belum dikonfigurasi; antrean penghapusan belum dikirim.')
  const failed:Tombstone[]=[]
  for(const item of queued){try{await deleteRow(item.kind,item.id)}catch(error){failed.push(item);console.error(`Gagal menghapus ${item.kind}/${item.id}; tetap dalam antrean.`,error)}}
  saveTombstones(failed)
  if(failed.length)throw new Error(`${failed.length} penghapusan Supabase masih tertunda.`)
}
const updated=(x:{updatedAt?:string;createdAt:string})=>validDate(x.updatedAt)?x.updatedAt:validDate(x.createdAt)?x.createdAt:''
const merge=<T extends {id:string;createdAt:string;updatedAt?:string}>(local:T[],remote:T[])=>[...new Map([...local,...remote].sort((a,b)=>updated(a).localeCompare(updated(b))).map(x=>[x.id,x])).values()]
const rows=<T extends {id:string;createdAt:string;updatedAt?:string}>(value:T[])=>value.filter(x=>x.id&&validDate(x.createdAt)).map(item=>({id:item.id,data:item,updated_at:updated(item)}))
async function upsert(table:string,value:unknown[]){if(!supabase||!value.length)return;const{error}=await supabase.from(table).upsert(value,{onConflict:'id'});if(error)throw error}
const normalizeRows=<T>(value:unknown,fn:(x:unknown)=>T|null):T[]=>Array.isArray(value)?value.map(row=>typeof row==='object'&&row!==null?fn((row as {data?:unknown}).data):null).filter((x):x is T=>x!==null):[]
const withoutPending=<T extends {id:string}>(kind:CollectionKind,value:T[],pending:Tombstone[])=>{const ids=new Set(pending.filter(x=>x.kind===kind).map(x=>x.id));return value.filter(x=>!ids.has(x.id))}

export async function syncNow():Promise<AppData>{
  if(!supabase)throw new Error('Supabase belum dikonfigurasi. Data tetap aman secara lokal.')
  try{await flushPendingDeletes()}catch(error){console.error('Sinkronisasi melanjutkan dengan tombstone aktif.',error)}
  const pending=readTombstones(),local=localSnapshot(),[t,m,r,s]=await Promise.all([supabase.from('tasks').select('data'),supabase.from('materials').select('data'),supabase.from('references').select('data'),supabase.from('app_settings').select('data').eq('id','profile').maybeSingle()])
  for(const result of[t,m,r,s])if(result.error)throw result.error
  const remoteSettings=typeof s.data==='object'&&s.data!==null?(s.data as {data?:unknown}).data:undefined
  const data:AppData={
    tasks:merge(local.tasks,withoutPending('tasks',normalizeRows(t.data,normalizeTask),pending)),
    materials:merge(local.materials,withoutPending('materials',normalizeRows(m.data,normalizeMaterial),pending)),
    references:merge(local.references,withoutPending('references',normalizeRows(r.data,normalizeReference),pending)),
    settings:remoteSettings?normalizeSettings(remoteSettings):local.settings
  }
  await Promise.all([upsert('tasks',rows(data.tasks)),upsert('materials',rows(data.materials)),upsert('references',rows(data.references)),supabase.from('app_settings').upsert({id:'profile',data:data.settings,updated_at:new Date().toISOString()},{onConflict:'id'}).then(({error})=>{if(error)throw error})])
  saveTasks(data.tasks);saveMaterials(data.materials);saveReferences(data.references);saveSettings(data.settings)
  return data
}
export async function pushCollection<T extends Task|Material|ReferenceItem>(kind:CollectionKind,value:T[]){if(supabase)await upsert(kind,rows(value))}
export async function pushSettings(value:UserSettings){if(!supabase)return;const{error}=await supabase.from('app_settings').upsert({id:'profile',data:normalizeSettings(value),updated_at:new Date().toISOString()},{onConflict:'id'});if(error)throw error}
export function subscribeRealtime(onChange:()=>void):()=>void{
  if(!supabase)return()=>{}
  let timer:number|undefined
  const notify=()=>{window.clearTimeout(timer);timer=window.setTimeout(onChange,350)}
  let channel:RealtimeChannel=supabase.channel('kelasku-realtime')
  for(const table of ['tasks','materials','references','app_settings'])channel=channel.on('postgres_changes',{event:'*',schema:'public',table},notify)
  channel=channel.subscribe()
  return()=>{window.clearTimeout(timer);void supabase?.removeChannel(channel)}
}
export async function checkCloud(){if(!supabase)return false;const{error}=await supabase.from('tasks').select('id').limit(1);return!error}
