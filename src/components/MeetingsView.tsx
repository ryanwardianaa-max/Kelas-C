import { BookOpen, CheckSquare, ExternalLink, Library } from "./Icons";
import { useState } from "react";
import { COURSE_SCHEDULE, SYLLABUS } from "../lib/mockData";
import type { Material, Page, ReferenceItem, Task } from "../types";

const displayMeetingTitle = (raw: string) => {
  const stripped = raw.replace(/^(?:Pertemuan|Tahap)\s+\d+\s*[:\-–]?\s*/i, "");
  const m = stripped.match(/^\((.*)\)$/);
  return m ? m[1] : (stripped || raw);
};

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
        const meetingMaterials = materials.filter(
            (x) => x.courseCode === course && x.meetingNo === m.meeting,
          ),
          meetingReferences = references.filter(
            (x) => x.courseCode === course && x.meetingNo === m.meeting,
          ),
          generalReferences = references.filter(
            (x) => x.courseCode === course && !x.meetingNo,
          ),
          meetingTasks = tasks.filter(
            (x) => x.courseCode === course && x.meetingNo === m.meeting,
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
                <b>{displayMeetingTitle(m.title)}</b>
              </span>
              <em className={`badge ${m.kind.toLowerCase().replace(" ", "-")}`}>
                {m.kind}
              </em>
            </button>
            {expanded && (
              <div className="meeting-body">
                <p style={{ margin: "10px 0 6px" }}>
                  <b>Ringkasan:</b> {m.summary}
                </p>
                <p style={{ margin: "0 0 14px" }}>
                  <b>Aktivitas:</b> {m.activity}
                </p>

                {/* Tautan Langsung Materi & Referensi Pertemuan Ini */}
                <div style={{ display: "grid", gap: "10px" }}>
                  {meetingMaterials.length > 0 && (
                    <div style={{ background: "var(--card, #ffffff)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border, #e2e8f0)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <small style={{ fontWeight: 800, color: "var(--accent, #059669)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.72rem" }}>
                        <BookOpen /> Bahan Belajar &amp; Modul Pertemuan Ini:
                      </small>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {meetingMaterials.map((mat) => (
                          <div key={mat.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 10px", background: "var(--bg, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border, #e2e8f0)", gap: "12px" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                                <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "#d1fae5", color: "#065f46", padding: "1px 6px", borderRadius: "4px" }}>
                                  {mat.type || "Catatan"}
                                </span>
                                <b style={{ fontSize: "0.88rem", color: "var(--text, #1e293b)" }}>{mat.title}</b>
                              </div>
                              {mat.description && (
                                <p style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)", margin: 0, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                  {mat.description}
                                </p>
                              )}
                            </div>
                            {mat.url && (
                              <a
                                href={mat.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  color: "#ffffff",
                                  background: "var(--accent, #059669)",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  textDecoration: "none",
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                }}
                              >
                                Buka Catatan <ExternalLink />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {meetingReferences.length > 0 && (
                    <div style={{ background: "var(--card, #ffffff)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border, #e2e8f0)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <small style={{ fontWeight: 800, color: "#0284c7", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.72rem" }}>
                        <Library /> Referensi Buku &amp; Bab Ajar:
                      </small>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {meetingReferences.map((ref) => (
                          <div key={ref.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 10px", background: "var(--bg, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border, #e2e8f0)", gap: "12px" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                                <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "#e0f2fe", color: "#0369a1", padding: "1px 6px", borderRadius: "4px" }}>
                                  {ref.category}
                                </span>
                                <b style={{ fontSize: "0.88rem", color: "var(--text, #1e293b)" }}>{ref.title}</b>
                              </div>
                              {ref.description && (
                                <p style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)", margin: 0, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                  {ref.description}
                                </p>
                              )}
                            </div>
                            {ref.urlOrPath && (
                              <a
                                href={ref.urlOrPath}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  color: "#ffffff",
                                  background: "#0284c7",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  textDecoration: "none",
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                }}
                              >
                                Buka Bab PDF <ExternalLink />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {meetingMaterials.length === 0 && meetingReferences.length === 0 && (
                    <div style={{ background: "var(--bg, #f8fafc)", border: "1px dashed var(--border, #cbd5e1)", borderRadius: "10px", padding: "12px 16px" }}>
                      <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--muted, #64748b)" }}>
                        Belum ada catatan kuliah terbit untuk pertemuan ini.
                      </p>
                      {generalReferences.length > 0 && (
                        <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card, #ffffff)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border, #e2e8f0)", gap: "10px" }}>
                          <div>
                            <small style={{ fontWeight: 700, color: "#0284c7", textTransform: "uppercase", fontSize: "0.7rem", display: "block" }}>Rujukan Perkuliahan</small>
                            <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>{generalReferences[0].title}</span>
                          </div>
                          {generalReferences[0].urlOrPath && (
                            <a
                              href={generalReferences[0].urlOrPath}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "0.76rem",
                                fontWeight: 700,
                                color: "#0284c7",
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Buka Buku <ExternalLink />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {meetingTasks.length > 0 && (
                    <div style={{ background: "var(--card, #ffffff)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border, #e2e8f0)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <small style={{ fontWeight: 800, color: "#ea580c", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.72rem" }}>
                        <CheckSquare /> Tugas Terkait:
                      </small>
                      <div style={{ display: "grid", gap: "6px" }}>
                        {meetingTasks.map((tsk) => (
                          <div key={tsk.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "var(--bg, #f8fafc)", borderRadius: "6px" }}>
                            <span style={{ fontSize: "0.86rem", textDecoration: tsk.completed ? "line-through" : "none", color: tsk.completed ? "var(--muted, #94a3b8)" : "var(--text, #1e293b)" }}>
                              {tsk.title}
                            </span>
                            <span style={{ fontSize: "0.76rem", color: tsk.completed ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                              {tsk.completed ? "Selesai" : `Deadline: ${new Date(tsk.dueAt).toLocaleDateString("id-ID")}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: "4px", display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => go("Materi")}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: "var(--muted, #64748b)",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Buka repositori materi lengkap →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
