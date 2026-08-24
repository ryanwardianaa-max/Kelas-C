import { BookOpen, CheckSquare, Library } from "./Icons";
import { useState } from "react";
import { COURSE_SCHEDULE, SYLLABUS } from "../lib/mockData";
import type { Material, Page, ReferenceItem, Task } from "../types";

export default function MeetingsView({
  materials,
  references,
  tasks,
  go,
}: {
  materials: Material[];
  references: ReferenceItem[];
  tasks: Task[];
  go: (page: Page) => void;
}) {
  const [course, setCourse] = useState(COURSE_SCHEDULE[0].code),
    [open, setOpen] = useState<number | null>(null),
    selected = COURSE_SCHEDULE.find((c) => c.code === course)!;

  return (
    <section className="syllabus">
      <div style={{ marginBottom: "16px" }}>
        <small
          style={{
            color: "#64748b",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "block",
            marginBottom: "8px",
          }}
        >
          Pilih Mata Kuliah:
        </small>
        <div
          className="chips"
          style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
        >
          {COURSE_SCHEDULE.map((c) => {
            const active = c.code === course;
            return (
              <button
                key={c.code}
                type="button"
                className={active ? "active" : ""}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  borderColor: active ? c.color : undefined,
                  background: active ? c.color : undefined,
                  color: active ? "#ffffff" : undefined,
                  fontWeight: active ? 700 : 500,
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setCourse(c.code);
                  setOpen(null);
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: active ? "#ffffff" : c.color,
                    display: "inline-block",
                  }}
                />
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="syllabus-summary panel"
        style={{ borderLeftColor: selected.color }}
      >
        <div>
          <small>
            {selected.code} · {selected.sks} SKS · {selected.lecturer}
          </small>
          <h2>{selected.name}</h2>
        </div>
        <b>
          {SYLLABUS[course].length}{" "}
          {course === "KF21518001" ? "tahap riset" : "pertemuan"}
        </b>
      </div>

      {SYLLABUS[course].map((m) => {
        const relatedMaterials = materials.filter(
            (x) =>
              x.courseCode === course &&
              (x.meetingNo === m.meeting || !x.meetingNo),
          ),
          relatedReferences = references.filter(
            (x) =>
              x.courseCode === course &&
              (x.meetingNo === m.meeting || !x.meetingNo),
          ),
          relatedTasks = tasks.filter(
            (x) =>
              x.courseCode === course &&
              (x.meetingNo === m.meeting || !x.meetingNo),
          ),
          expanded = open === m.meeting;

        return (
          <article className="panel meeting" key={m.meeting}>
            <button
              className="meeting-head"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : m.meeting)}
            >
              <span className="meeting-number">{m.meeting}</span>
              <span>
                <small>
                  {course === "KF21518001" ? "TAHAP" : "PERTEMUAN"} {m.meeting}
                </small>
                <b>{m.title}</b>
              </span>
              <em className={`badge ${m.kind.toLowerCase().replace(" ", "-")}`}>
                {m.kind}
              </em>
            </button>
            {expanded && (
              <div className="meeting-body">
                <p>
                  <b>Ringkasan:</b> {m.summary}
                </p>
                <p>
                  <b>Aktivitas:</b> {m.activity}
                </p>
                <div className="related">
                  <button onClick={() => go("Materi")}>
                    <BookOpen /> {relatedMaterials.length} materi terkait
                  </button>
                  <button onClick={() => go("Referensi")}>
                    <Library /> {relatedReferences.length} referensi
                  </button>
                  <button onClick={() => go("Tugas")}>
                    <CheckSquare /> {relatedTasks.length} tugas
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
