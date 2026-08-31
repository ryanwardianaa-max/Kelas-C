import { Pencil, Plus, Trash2 } from "./Icons";
import { useState } from "react";
import { COURSE_SCHEDULE, courseName } from "../lib/mockData";
import type { Material, Page, ReferenceItem, Task } from "../types";
import InteractiveMath from "./InteractiveMath";
import MeetingsView from "./MeetingsView";
import Modal from "./Modals/Modal";
import ConfirmModal from "./Modals/ConfirmModal";
const blank = (): Material => ({
  id: crypto.randomUUID(),
  title: "",
  courseCode: COURSE_SCHEDULE[0].code,
  type: "Catatan",
  description: "",
  url: "",
  createdAt: new Date().toISOString(),
});
export default function MaterialsView({
  items,
  setItems,
  references,
  tasks,
  go,
  initialTab = "koleksi",
}: {
  items: Material[];
  setItems: (v: Material[]) => void;
  references: ReferenceItem[];
  tasks: Task[];
  go: (p: Page) => void;
  initialTab?: "koleksi" | "visual" | "silabus";
}) {
  const [tab, setTab] = useState<"koleksi" | "visual" | "silabus">(initialTab),
    [edit, setEdit] = useState<Material | null>(null),
    [deleting, setDeleting] = useState<Material | null>(null);
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setItems(
      items.some((x) => x.id === edit.id)
        ? items.map((x) => (x.id === edit.id ? edit : x))
        : [...items, edit],
    );
    setEdit(null);
  };
  return (
    <>
      <div className="page-title action-title">
        <div>
          <small>PERPUSTAKAAN KELAS</small>
          <h1>Materi kuliah</h1>

        </div>
        {tab === "koleksi" && (
          <button className="primary" onClick={() => setEdit(blank())}>
            <Plus /> Tambah materi
          </button>
        )}
      </div>
      <div className="chips">
        <button
          className={tab === "koleksi" ? "active" : ""}
          onClick={() => setTab("koleksi")}
        >
          Koleksi saya
        </button>
        <button
          className={tab === "silabus" ? "active" : ""}
          onClick={() => setTab("silabus")}
        >
          Silabus 16 Pertemuan
        </button>
        <button
          className={tab === "visual" ? "active" : ""}
          onClick={() => setTab("visual")}
        >
          Visualisasi interaktif
        </button>
      </div>
      {tab === "visual" ? (
        <InteractiveMath />
      ) : tab === "silabus" ? (
        <MeetingsView
          materials={items}
          references={references}
          tasks={tasks}
          go={go}
        />
      ) : (
        <div className="card-grid">
          {items.length ? (
            items.map((m) => (
              <article className="panel card" key={m.id}>
                <small>
                  {m.type} · {courseName(m.courseCode)}
                  {m.meetingNo ? ` · Pertemuan ${m.meetingNo}` : ""}
                </small>
                <h3>{m.title}</h3>
                <p>{m.description || "Tanpa deskripsi"}</p>
                {m.url && (
                  <a href={m.url} target="_blank" rel="noreferrer">
                    Buka materi
                  </a>
                )}
                <footer>
                  <button
                    className="icon"
                    aria-label="Edit materi"
                    onClick={() => setEdit(m)}
                  >
                    <Pencil />
                  </button>
                  <button
                    className="icon danger"
                    aria-label="Hapus materi"
                    onClick={() => setDeleting(m)}
                  >
                    <Trash2 />
                  </button>
                </footer>
              </article>
            ))
          ) : (
            <div className="panel empty">
              <h3>Belum ada materi tersimpan</h3>
              <p>Tambahkan catatan, dokumen, slide, atau video milikmu.</p>
              <button onClick={() => setEdit(blank())}>+ Tambah materi</button>
            </div>
          )}
        </div>
      )}
      <ConfirmModal
        open={Boolean(deleting)}
        title="Hapus materi?"
        message={`Materi “${deleting?.title ?? ""}” akan dihapus permanen.`}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) setItems(items.filter((x) => x.id !== deleting.id));
          setDeleting(null);
        }}
      />
      {edit && (
        <Modal title="Materi kuliah" onClose={() => setEdit(null)}>
          <form onSubmit={save}>
            <label>
              Judul
              <input
                required
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
            </label>
            <label>
              Mata kuliah
              <select
                value={edit.courseCode}
                onChange={(e) =>
                  setEdit({ ...edit, courseCode: e.target.value })
                }
              >
                {COURSE_SCHEDULE.map((c) => (
                  <option value={c.code} key={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pertemuan (opsional)
              <select
                value={edit.meetingNo ?? ""}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    meetingNo: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              >
                <option value="">Tidak spesifik</option>
                {Array.from(
                  { length: edit.courseCode === "KF21518001" ? 7 : 16 },
                  (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Pertemuan {i + 1}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              Jenis
              <select
                value={edit.type}
                onChange={(e) =>
                  setEdit({ ...edit, type: e.target.value as Material["type"] })
                }
              >
                {["Catatan", "Dokumen", "Slide", "Video"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Deskripsi
              <textarea
                value={edit.description}
                onChange={(e) =>
                  setEdit({ ...edit, description: e.target.value })
                }
              />
            </label>
            <label>
              URL (opsional)
              <input
                type="url"
                value={edit.url}
                onChange={(e) => setEdit({ ...edit, url: e.target.value })}
              />
            </label>
            <div className="form-actions">
              <button type="button" onClick={() => setEdit(null)}>
                Batal
              </button>
              <button className="primary">Simpan</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
