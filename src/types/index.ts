export type Page = 'Beranda' | 'Jadwal' | 'Tugas' | 'Materi' | 'Referensi' | 'Kalender' | 'Pengaturan'
export type Theme = 'light' | 'dark'
export type AIProvider = 'local' | 'cloud'
export interface Course { id:number; code:string; name:string; sks:number; dayIndex:number; dayName:string; startTime:string; endTime:string; room:string; lecturer:string; color:string; topics:string[] }
export type MeetingKind='Teori'|'Praktikum'|'UTS'|'UAS'|'Tahap Riset'
export interface SyllabusMeeting { meeting:number; title:string; summary:string; activity:string; kind:MeetingKind }
export interface Task { id:string; title:string; courseCode:string; description:string; dueAt:string; completed:boolean; createdAt:string; updatedAt?:string }
export interface Material { id:string; title:string; courseCode:string; type:'Catatan'|'Dokumen'|'Slide'|'Video'; description:string; url:string; createdAt:string; updatedAt?:string }
export type ReferenceCategory = 'Jurnal'|'E-Book'|'Website'|'Drive/File'|'Video'|'Catatan'
export interface ReferenceItem { id:string; title:string; courseCode:string; category:ReferenceCategory; urlOrPath:string; description:string; tags:string[]; createdAt:string; updatedAt?:string }
export interface AISettings { provider:AIProvider; localEndpoint:string; localKey:string; localModel:string; cloudEndpoint:string; cloudKey:string; cloudModel:string; timeoutMs:number }
export interface UserSettings { name:string; nim:string; email:string; program:string; semester:string; className:string; target:string; notifications:boolean; sound:boolean; theme:Theme; ai:AISettings }
export interface BackupData { version:number; exportedAt:string; tasks:Task[]; materials:Material[]; references:ReferenceItem[]; settings:UserSettings }
export interface AppData { tasks:Task[]; materials:Material[]; references:ReferenceItem[]; settings:UserSettings }
export interface ChatMessage { id:string; role:'user'|'assistant'; content:string }
export type SmartAction = { type:'navigate'; page:Page } | { type:'search'; page:'Materi'|'Referensi'; query:string } | { type:'add-task'; title:string; dueAt?:string; courseCode?:string } | { type:'none' }
