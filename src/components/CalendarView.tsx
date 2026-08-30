import { ChevronLeft,ChevronRight,Download } from './Icons';import { useState } from 'react';import { COURSE_SCHEDULE } from '../lib/mockData';import type { Task } from '../types';import { validDate } from '../lib/storage';import { atTime,wibToday } from '../lib/schedule'
const pad=(n:number)=>String(n).padStart(2,'0')
/** Ditulis sebagai UTC eksplisit (akhiran Z) supaya aplikasi kalender tujuan
 *  menggeser sendiri ke zona penggunanya; jam kuliah tidak ikut salah bila zona
 *  waktu perangkat keliru. */
function icsDate(d:Date){return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`}
const WEEK_MS=7*86400000
function exportICS(tasks:Task[]){
  const now=new Date(),events:string[]=[]
  for(let week=0;week<20;week++)for(const c of COURSE_SCHEDULE){
    const start=new Date(atTime(now,c.dayIndex,c.startTime).getTime()+week*WEEK_MS)
    const end=new Date(atTime(now,c.dayIndex,c.endTime).getTime()+week*WEEK_MS)
    events.push(['BEGIN:VEVENT',`UID:${c.code}-${week}@kelasku`,`DTSTART:${icsDate(start)}`,`DTEND:${icsDate(end)}`,`SUMMARY:${c.name}`,`LOCATION:${c.room}`,'END:VEVENT'].join('\r\n'))
  }
  for(const t of tasks){
    if(!validDate(t.dueAt))continue
    events.push(['BEGIN:VEVENT',`UID:${t.id}@kelasku`,`DTSTART:${icsDate(new Date(t.dueAt))}`,`SUMMARY:Deadline: ${t.title}`,'END:VEVENT'].join('\r\n'))
  }
  const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//KelasKu//ID',...events,'END:VCALENDAR'].join('\r\n')
  const blob=new Blob([body],{type:'text/calendar'}),url=URL.createObjectURL(blob),a=document.createElement('a')
  a.href=url;a.download='kelasku-kalender.ics';a.click();URL.revokeObjectURL(url)
}
export default function CalendarView({tasks}:{tasks:Task[]}){
  const[view,setView]=useState(()=>{const t=wibToday();return new Date(t.year,t.month,1)})
  const year=view.getFullYear(),month=view.getMonth(),first=new Date(year,month,1),offset=(first.getDay()+6)%7,days=new Date(year,month+1,0).getDate(),cells=Array.from({length:offset+days},(_,i)=>i-offset+1)
  const shift=(n:number)=>setView(new Date(year,month+n,1))
  // "Hari ini" mengikuti WIB, bukan tanggal perangkat.
  const today=wibToday()
  return <><div className="page-title action-title"><div><small>KALENDER AKADEMIK</small><h1>{view.toLocaleDateString('id-ID',{month:'long',year:'numeric'})}</h1><p>Jadwal mingguan dan deadline mengikuti Waktu Indonesia Barat.</p></div><button className="primary" onClick={()=>exportICS(tasks)}><Download/> Ekspor .ICS</button></div><section className="panel calendar"><header><button className="icon" aria-label="Bulan sebelumnya" onClick={()=>shift(-1)}><ChevronLeft/></button><button onClick={()=>setView(new Date(today.year,today.month,1))}>Hari ini</button><button className="icon" aria-label="Bulan berikutnya" onClick={()=>shift(1)}><ChevronRight/></button></header><div className="week">{['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(x=><b key={x}>{x}</b>)}</div><div className="dates">{cells.map((d,i)=>d<1?<div key={i}/>:<div key={i} className={d===today.date&&month===today.month&&year===today.year?'today':''}><b>{d}</b>{COURSE_SCHEDULE.filter(c=>(c.dayIndex+6)%7===i%7).map(c=><i key={c.code} style={{background:c.color}} title={c.name}/>)}{tasks.filter(t=>{if(!validDate(t.dueAt))return false;const x=new Date(t.dueAt);return x.getDate()===d&&x.getMonth()===month&&x.getFullYear()===year}).map(t=><i className="deadline" key={t.id} title={t.title}/>)}</div>)}</div></section><div className="legend"><span><i/> Jadwal kuliah</span><span><i className="deadline"/> Deadline tugas</span></div></>
}
