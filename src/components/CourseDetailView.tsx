import { useState } from "react";
import { ChevronLeft, ExternalLink, Plus } from "./Icons";
import { SYLLABUS } from "../lib/mockData";
import type {
  Course,
  Material,
  MeetingNote,
  ReferenceItem,
  Task,
} from "../types";
type Kind = "task" | "material" | "reference";
export default function CourseDetailView({
  course,
  tasks,
  setTasks,
  materials,
  setMaterials,
  references,
  setReferences,
  notes,
  setNotes,
  onBack,
}: {
  course: Course;
  tasks: Task[];
  setTasks: (v: Task[]) => void;
  materials: Material[];
  setMaterials: (v: Material[]) => void;
  references: ReferenceItem[];
  setReferences: (v: ReferenceItem[]) => void;
  notes: MeetingNote[];
  setNotes: (v: MeetingNote[]) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"meetings" | "tasks" | "refs">("meetings"),
    [open, setOpen] = useState<number | null>(null),
    [adding, setAdding] = useState<{ kind: Kind; meetingNo: number } | null>(
      null,
    ),
    [title, setTitle] = useState("");
  const meetings = SYLLABUS[course.code] || [];
  const noteFor = (n: number) =>
    notes.find((x) => x.courseCode === course.code && x.meetingNo === n);
  const saveNote = (meetingNo: number, content: string) => {
    const old = noteFor(meetingNo),
      next: MeetingNote = {
        id: old?.id || `${course.code}-${meetingNo}`,
        courseCode: course.code,
        meetingNo,
        content,
        updatedAt: new Date().toISOString(),
      };
    setNotes(
      old ? notes.map((x) => (x.id === old.id ? next : x)) : [...notes, next],
    );
  };
  const add = () => {
    if (!adding || !title.trim()) return;
    const now = new Date().toISOString(),
      base = {
        id: crypto.randomUUID(),
        title: title.trim(),
        courseCode: course.code,
        meetingNo: adding.meetingNo,
        createdAt: now,
      };
    if (adding.kind === "task")
      setTasks([
        ...tasks,
        {
          ...base,
          description: "",
          dueAt: new Date(Date.now() + 86400000).toISOString(),
          completed: false,
        },
      ]);
    else if (adding.kind === "material")
      setMaterials([
        ...materials,
        { ...base, type: "Catatan", description: "", url: "" },
      ]);
    else
      setReferences([
        ...references,
        {
          ...base,
          category: "Website",
          urlOrPath: "",
          description: "",
          tags: [],
        },
      ]);
    setTitle("");
    setAdding(null);
  };
  return (
    <>
      <button className="back-button" onClick={onBack}>
        <ChevronLeft /> Kembali ke Daftar Matkul
      </button>
      <header
        className="course-detail-header"
        style={{ borderColor: course.color }}
      >
        <small>
          {course.code} · {course.sks} SKS
        </small>
        <h1>{course.name}</h1>
        <p>
          {course.lecturer} · {course.room} · {course.dayName},{" "}
          {course.startTime}–{course.endTime}
        </p>
      </header>
      <div className="chips course-tabs">
        <button
          className={tab === "meetings" ? "active" : ""}
          onClick={() => setTab("meetings")}
        >
          Pertemuan
        </button>
        <button
          className={tab === "tasks" ? "active" : ""}
          onClick={() => setTab("tasks")}
        >
          Semua Tugas Matkul
        </button>
        <button
          className={tab === "refs" ? "active" : ""}
          onClick={() => setTab("refs")}
        >
          Referensi & Modul
        </button>
      </div>
      {tab === "tasks" ? (
        <section className="panel scoped-list">
          {tasks
            .filter((x) => x.courseCode === course.code)
            .map((x) => (
              <article key={x.id}>
                <b>{x.title}</b>
                <span>
                  Pertemuan {x.meetingNo ?? "umum"} ·{" "}
                  {x.completed
                    ? "Selesai"
                    : new Date(x.dueAt).toLocaleString("id-ID")}
                </span>
              </article>
            ))}
          {!tasks.some((x) => x.courseCode === course.code) && (
            <p className="empty">Belum ada tugas mata kuliah ini.</p>
          )}
        </section>
      ) : tab === "refs" ? (
        <section className="panel scoped-list">
          {materials
            .filter((x) => x.courseCode === course.code)
            .map((x) => (
              <article key={x.id}>
                <b>{x.title}</b>
                <span>Pertemuan {x.meetingNo ?? "umum"}</span>
              </article>
            ))}
          {references
            .filter((x) => x.courseCode === course.code)
            .map((x) => (
              <article key={x.id}>
                <b>{x.title}</b>
                <span>
                  {x.category} · Pertemuan {x.meetingNo ?? "umum"}
                </span>
                {x.description && <p>{x.description}</p>}
                {x.tags.length > 0 && (
                  <div className="tags">
                    {x.tags.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                )}
                {x.urlOrPath && (
                  <a
                    className="button"
                    href={x.urlOrPath}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink /> Buka Tautan
                  </a>
                )}
              </article>
            ))}
          {![...materials, ...references].some(
            (x) => x.courseCode === course.code,
          ) && <p className="empty">Belum ada referensi atau modul.</p>}
        </section>
      ) : (
        <div className="meetings-list">
          {meetings.map((m) => {
            const scopedTasks = tasks.filter(
                (x) =>
                  x.courseCode === course.code && x.meetingNo === m.meeting,
              ),
              scopedMaterials = materials.filter(
                (x) =>
                  x.courseCode === course.code && x.meetingNo === m.meeting,
              ),
              scopedRefs = references.filter(
                (x) =>
                  x.courseCode === course.code && x.meetingNo === m.meeting,
              );
            return (
              <section className="panel meeting" key={m.meeting}>
                <button
                  className="meeting-head"
                  aria-expanded={open === m.meeting}
                  onClick={() => setOpen(open === m.meeting ? null : m.meeting)}
                >
                  <span className="meeting-number">{m.meeting}</span>
                  <span>
                    <b>
                      {course.name === "Skripsi" ? "Tahap" : "Pertemuan"}{" "}
                      {m.meeting}: {m.title}
                    </b>
                    <small>{m.kind}</small>
                  </span>
                  <span>{open === m.meeting ? "−" : "+"}</span>
                </button>
                {open === m.meeting && (
                  <div className="meeting-workspace">
                    <label>
                      Catatan Kuliah <small>tersimpan otomatis</small>
                      <textarea
                        rows={7}
                        placeholder="Tulis catatan kuliah pertemuan ini…"
                        value={noteFor(m.meeting)?.content || ""}
                        onChange={(e) => saveNote(m.meeting, e.target.value)}
                      />
                    </label>
                    <div className="plan">
                      <span className="badge">Draft / Rencana Bahasan</span>
                      <h3>{m.title}</h3>
                      <p>{m.summary}</p>
                    </div>
                    <Scoped
                      title="Tugas Pertemuan Ini"
                      items={scopedTasks}
                      onAdd={() =>
                        setAdding({ kind: "task", meetingNo: m.meeting })
                      }
                    />
                    <Scoped
                      title="Bahan Materi"
                      items={scopedMaterials}
                      onAdd={() =>
                        setAdding({ kind: "material", meetingNo: m.meeting })
                      }
                    />
                    <Scoped
                      title="Referensi Pertemuan"
                      items={scopedRefs}
                      onAdd={() =>
                        setAdding({ kind: "reference", meetingNo: m.meeting })
                      }
                    />
                    {adding?.meetingNo === m.meeting && (
                      <div className="quick-add">
                        <input
                          autoFocus
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={`Judul ${adding.kind}`}
                        />
                        <button onClick={() => setAdding(null)}>Batal</button>
                        <button className="primary" onClick={add}>
                          Simpan
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
function Scoped({
  title,
  items,
  onAdd,
}: {
  title: string;
  items: { id: string; title: string; url?: string; urlOrPath?: string }[];
  onAdd: () => void;
}) {
  return (
    <section className="meeting-section">
      <div>
        <h3>{title}</h3>
        <button onClick={onAdd}>
          <Plus /> Tambah
        </button>
      </div>
      {items.length ? (
        <ul>
          {items.map((x) => (
            <li key={x.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              <span>{x.title}</span>
              {(x.url || x.urlOrPath) && (
                <a
                  href={x.url || x.urlOrPath}
                  target="_blank"
                  rel="noreferrer"
                  className="button"
                  style={{
                    fontSize: "0.8rem",
                    padding: "4px 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    textDecoration: "none",
                    whiteSpace: "nowrap"
                  }}
                >
                  <ExternalLink /> Buka Materi
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-inline">Belum ada data untuk pertemuan ini.</p>
      )}
    </section>
  );
}
