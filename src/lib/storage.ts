import type { BackupData,Material,ReferenceItem,Task,Theme,UserSettings } from '../types'
const K={tasks:'kelasku_tasks',materials:'kelasku_materials',references:'kelasku_references',settings:'kelasku_settings',theme:'kelasku_theme'} as const
export const DEFAULT_SETTINGS:UserSettings={name:'',nim:'',email:'',program:'Pendidikan Matematika',semester:'7',className:'C',target:'',notifications:false,sound:false,theme:'light',ai:{provider:'local',localEndpoint:import.meta.env.VITE_NINEROUTER_BASE_URL||'http://127.0.0.1:20128/v1',localKey:import.meta.env.VITE_NINEROUTER_API_KEY||'',localModel:import.meta.env.VITE_NINEROUTER_MODEL||'cx/gpt-5.6-sol',cloudEndpoint:import.meta.env.VITE_OPENAI_BASE_URL||'https://api.openai.com/v1',cloudKey:import.meta.env.VITE_OPENAI_API_KEY||'',cloudModel:import.meta.env.VITE_OPENAI_MODEL||'gpt-4o-mini',timeoutMs:20000}}
const read=<T>(key:string,fallback:T):T=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback}}
const save=<T>(key:string,value:T)=>localStorage.setItem(key,JSON.stringify(value))
export const getTasks=()=>read<Task[]>(K.tasks,[]); export const saveTasks=(v:Task[])=>save(K.tasks,v)
export const getMaterials=()=>read<Material[]>(K.materials,[]); export const saveMaterials=(v:Material[])=>save(K.materials,v)
export const getReferences=()=>read<ReferenceItem[]>(K.references,[]); export const saveReferences=(v:ReferenceItem[])=>save(K.references,v)
export const getSettings=():UserSettings=>{const old=read<Partial<UserSettings>>(K.settings,{});return{...DEFAULT_SETTINGS,...old,ai:{...DEFAULT_SETTINGS.ai,...old.ai}}}
export const saveSettings=(v:UserSettings)=>{save(K.settings,v);localStorage.setItem(K.theme,v.theme)}
export const getTheme=():Theme=>(localStorage.getItem(K.theme)==='dark'?'dark':'light')
export function exportDataAsJSON(){const data:BackupData={version:2,exportedAt:new Date().toISOString(),tasks:getTasks(),materials:getMaterials(),references:getReferences(),settings:getSettings()};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`kelasku-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url)}
export function importDataFromJSON(text:string){const d=JSON.parse(text) as Partial<BackupData>;if(!Array.isArray(d.tasks)||!Array.isArray(d.materials)||!Array.isArray(d.references)||!d.settings)throw new Error('Format cadangan tidak valid');saveTasks(d.tasks);saveMaterials(d.materials);saveReferences(d.references);saveSettings({...getSettings(),...d.settings,ai:{...DEFAULT_SETTINGS.ai,...d.settings.ai}})}
export function resetStorage(){Object.values(K).forEach(k=>localStorage.removeItem(k))}
