import { CheckSquare, Clock, MapPin } from "./Icons";
import { useEffect, useState } from "react";
import { COURSE_SCHEDULE, courseName } from "../lib/mockData";
import { countdown, formatDate, getCurrentOrNext } from "../lib/schedule";
import { validDate } from "../lib/storage";
import type { Page, Task, UserSettings } from "../types";

export default function DashboardView({
  tasks,
  settings,
  go,
}: {
  tasks: Task[];
  settings: UserSettings;
  go: (p: Page) => void;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const next = getCurrentOrNext(COURSE_SCHEDULE, now);
  const pending = tasks.filter((task) => !task.completed);
  const near = pending
    .filter((task) => validDate(task.dueAt))
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))
    .slice(0, 3);

  return (
    <>
      <header className="page-title dashboard-title">
        <p>{formatDate(now)}</p>
        <h1>Halo{settings.name ? `, ${settings.name.split(" ")[0]}` : ""}</h1>
        <div className="dashboard-meta" aria-label="Ringkasan akademik">
          <span>6 mata kuliah</span>
          <span>{pending.length} tugas aktif</span>
        </div>
      </header>

      <section className="hero" aria-labelledby="next-course-title">
        <div>
          <div className="hero-header-badge">
            <span className="hero-status-pill">
              {next.ongoing ? "Sedang berlangsung" : "Kuliah berikutnya"}
            </span>
            <span className="hero-date-text">{formatDate(next.start)}</span>
          </div>
          <h2 id="next-course-title">{next.course.name}</h2>
          <p>
            <Clock aria-hidden="true" /> {next.course.startTime}–{next.course.endTime}
            <span aria-hidden="true">·</span>
            <MapPin aria-hidden="true" /> {next.course.room}
          </p>
          <footer>
            <div>
              <small>{next.ongoing ? "Berakhir dalam" : "Dimulai dalam"}</small>
              <b>{countdown(next.remaining)}</b>
            </div>
            <button onClick={() => go("Jadwal")}>Lihat jadwal</button>
          </footer>
        </div>
      </section>

      <section className="panel deadline-panel">
        <div className="panel-head">
          <h2>Deadline terdekat</h2>
          <button className="quiet-action" onClick={() => go("Tugas")}>Lihat semua</button>
        </div>
        {near.length ? (
          near.map((task) => (
            <article className="row" key={task.id}>
              <i style={{ background: COURSE_SCHEDULE.find((course) => course.code === task.courseCode)?.color }} />
              <div>
                <b>{task.title}</b>
                <small>{courseName(task.courseCode)}</small>
              </div>
              <time dateTime={task.dueAt}>
                {new Date(task.dueAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </time>
            </article>
          ))
        ) : (
          <div className="empty dashboard-empty">
            <CheckSquare aria-hidden="true" />
            <p>Belum ada tugas aktif.</p>
            <button onClick={() => go("Tugas")}>Tambah tugas</button>
          </div>
        )}
      </section>
    </>
  );
}
