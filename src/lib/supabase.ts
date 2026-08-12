import { createClient,type RealtimeChannel,type SupabaseClient } from '@supabase/supabase-js'
import { getMaterials,getReferences,getSettings,getTasks,saveMaterials,saveReferences,saveSettings,saveTasks } from './storage'
import type { AppData,Material,ReferenceItem,Task,UserSettings } from '../types'

const url=import.meta.env.VITE_SUPABASE_URL?.trim()
const key=import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
export const supabase:SupabaseClient|null=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}):null
export const cloudConfigured=()=>Boolean(supabase)
export const localSnapshot=():AppData=>({tasks:getTasks(),materials:getMaterials(),references:getReferences(),settings:getSettings()})
const updated=(x:{updatedAt?:string;createdAt:string})=>x.updatedAt||x.createdAt
const merge=<T extends {id:string;createdAt:string;updatedAt?:string}>(local:T[],remote:T[])=>[...new Map([...local,...remote].sort((a,b)=>updated(a).localeCompare(updated(b))).map(x=>[x.id,x])).values()]
const rows=<T extends {id:string;createdAt:string;updatedAt?:string}>(value:T[])=>value.map(item=>({id:item.id,data:item,updated_at:updated(item)}))
async function upsert(table:string,value:unknown[]){if(!supabase||!value.length)return;const {error}=await supabase.from(table).upsert(value,{onConflict:'id'});if(error)throw error}
export async function syncNow():Promise<AppData>{
 if(!supabase)throw new Error('Supabase belum dikonfigurasi. Data tetap aman secara lokal.')
 const local=localSnapshot();const [t,m,r,s]=await Promise.all([supabase.from('tasks').select('data'),supabase.from('materials').select('data'),supabase.from('references').select('data'),supabase.from('app_settings').select('data').eq('id','profile').maybeSingle()])
 for(const result of [t,m,r,s])if(result.error)throw result.error
 const data:AppData={tasks:merge(local.tasks,(t.data||[]).map(x=>x.data as Task)),materials:merge(local.materials,(m.data||[]).map(x=>x.data as Material)),references:merge(local.references,(r.data||[]).map(x=>x.data as ReferenceItem)),settings:(s.data?.data as UserSettings|undefined)||local.settings}
 await Promise.all([upsert('tasks',rows(data.tasks)),upsert('materials',rows(data.materials)),upsert('references',rows(data.references)),supabase.from('app_settings').upsert({id:'profile',data:data.settings,updated_at:new Date().toISOString()},{onConflict:'id'}).then(({error})=>{if(error)throw error})])
 saveTasks(data.tasks);saveMaterials(data.materials);saveReferences(data.references);saveSettings(data.settings);return data
}
export async function pushCollection<T extends Task|Material|ReferenceItem>(kind:'tasks'|'materials'|'references',value:T[]){if(!supabase)return;await upsert(kind,rows(value))}
export async function pushSettings(value:UserSettings){if(!supabase)return;const {error}=await supabase.from('app_settings').upsert({id:'profile',data:value,updated_at:new Date().toISOString()},{onConflict:'id'});if(error)throw error}
export function subscribeRealtime(onChange:()=>void):()=>void{if(!supabase)return()=>{};let timer:number|undefined;const channel:RealtimeChannel=supabase.channel('kelasku-realtime').on('postgres_changes',{event:'*',schema:'public'},()=>{window.clearTimeout(timer);timer=window.setTimeout(onChange,350)}).subscribe();return()=>{window.clearTimeout(timer);void supabase.removeChannel(channel)}}
export async function checkCloud():Promise<boolean>{if(!supabase)return false;const {error}=await supabase.from('tasks').select('id').limit(1);return !error}
