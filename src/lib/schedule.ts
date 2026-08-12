import type { Course } from '../types'
const atTime=(base:Date, day:number, time:string)=>{const d=new Date(base); const delta=(day-base.getDay()+7)%7; d.setDate(base.getDate()+delta); const [h,m]=time.split(':').map(Number); d.setHours(h,m,0,0); return d}
export interface ScheduleState { course:Course; start:Date; end:Date; ongoing:boolean; remaining:number }
export function getCurrentOrNext(courses:Course[],now=new Date()):ScheduleState {
 const options=courses.map(course=>{let start=atTime(now,course.dayIndex,course.startTime);let end=atTime(now,course.dayIndex,course.endTime);if(end<=now){start.setDate(start.getDate()+7);end.setDate(end.getDate()+7)}const ongoing=start<=now&&now<end;return{course,start,end,ongoing,remaining:ongoing?end.getTime()-now.getTime():start.getTime()-now.getTime()}})
 return options.sort((a,b)=>Number(b.ongoing)-Number(a.ongoing)||a.remaining-b.remaining)[0]
}
export const countdown=(ms:number)=>{const mins=Math.max(0,Math.floor(ms/60000));const d=Math.floor(mins/1440),h=Math.floor((mins%1440)/60),m=mins%60;return [d&&`${d} hari`,h&&`${h} jam`,`${m} menit`].filter(Boolean).join(', ')}
export const formatDate=(d:Date)=>new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d)
