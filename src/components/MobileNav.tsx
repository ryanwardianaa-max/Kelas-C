import { BookOpen,CalendarDays,CheckSquare,Home,Library } from 'lucide-react';import type { Page } from '../types'
const items=[['Beranda',Home],['Jadwal',CalendarDays],['Tugas',CheckSquare],['Materi',BookOpen],['Referensi',Library]] as const
export default function MobileNav({page,setPage}:{page:Page;setPage:(p:Page)=>void}){return <nav className="mobile-nav">{items.map(([p,I])=><button className={page===p?'active':''} onClick={()=>setPage(p)} key={p}><I/><span>{p}</span></button>)}</nav>}
