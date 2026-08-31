import { CheckSquare, Clock, MapPin } from "./Icons";
import { useEffect, useState } from "react";
import { COURSE_SCHEDULE, courseName } from "../lib/mockData";
import { countdown, formatDate, getCurrentOrNext } from "../lib/schedule";
import { validDate } from "../lib/storage";
import type { Page, Task, UserSettings } from "../types";

export default function DashboardView({ tasks, settings, go }: { tasks: Task[]; settings: UserSettings; go: (p: Page) => void }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const next = getCurrentOrNext(COURSE_SCHEDULE, now);
  const pending = tasks.filter((task) => !task.completed);
  const near = pending.filter((task) => validDate(task.dueAt)).sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt)).slice(0, 3);
  return <>
    <div className="page-title"><small>{formatDate(now).toUpperCase()}</small><h1>Selamat datang{settings.name ? `, ${settings.name.split(" ")[0]}` : ""}.</h1></div>
    <section className="hero"><div><div className="hero-header-badge"><span className="hero-status-pill">{next.ongoing ? "SEDANG BERLANGSUNG" : "KULIAH BERIKUTNYA"}</span><span className="hero-date-text">{formatDate(next.start)}</span></div><h2>{next.course.name}</h2><p><Clock /> {next.course.startTime}–{next.course.endTime} &nbsp; <MapPin /> {next.course.room}</p><footer><div><small>{next.ongoing ? "BERAKHIR DALAM" : "DIMULAI DALAM"}</small><b>{countdown(next.remaining)}</b></div><button onClick={() => go("Jadwal")}>Lihat jadwal</button></footer></div></section>
    <section className="panel"><div className="panel-head"><div><h2>Deadline terdekat</h2><p>Tugas yang perlu diselesaikan.</p></div><button onClick={() => go("Tugas")}>Kelola tugas</button></div>{near.length ? near.map((task) => <article className="row" key={task.id}><i style={{ background: COURSE_SCHEDULE.find((course) => course.code === task.courseCode)?.color }} /><div><b>{task.title}</b><small>{courseName(task.courseCode)}</small></div><time>{new Date(task.dueAt).toLocaleString("id-ID")}</time></article>) : <div className="empty"><CheckSquare /><h3>Belum ada tugas</h3><p>Tambahkan tugas agar deadline muncul di sini.</p><button onClick={() => go("Tugas")}>+ Tambah tugas</button></div>}</section>
  </>;
}
