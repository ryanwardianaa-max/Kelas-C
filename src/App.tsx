import { useEffect, useRef, useState } from "react";
import "./App.css";
import AIAssistantDrawer from "./components/AIAssistantDrawer";
import CalendarView from "./components/CalendarView";
import DashboardView from "./components/DashboardView";
import CoursesView from "./components/CoursesView";
import CourseDetailView from "./components/CourseDetailView";
import MaterialsView from "./components/MaterialsView";
import MobileNav from "./components/MobileNav";
import Navbar from "./components/Navbar";
import ReferencesView from "./components/ReferencesView";
import ScheduleView from "./components/ScheduleView";
import SettingsView from "./components/SettingsView";
import Sidebar from "./components/Sidebar";
import TasksView from "./components/TasksView";
import ToolsView from "./components/ToolsView";
import { COURSE_SCHEDULE } from "./lib/mockData";
import { DEFAULT_SETTINGS, validDate } from "./lib/storage";
import { INITIAL_MATERIALS } from "./lib/initialMaterials";
import { INITIAL_METNUM_REFERENCES } from "./lib/initialReferences";
import { commitCollection, commitValue, createWriteGate, errorText, type CloudIO, type CollectionKind } from "./lib/cloudStore";
import { deleteRows, pushCollection, pushSettings, syncNow } from "./lib/supabase";
import type {
  AppData,
  Course,
  Material,
  MeetingNote,
  Page,
  ReferenceItem,
  SmartAction,
  Task,
  Theme,
  UserSettings,
} from "./types";

/** Supabase adalah satu-satunya tempat penyimpanan; tidak ada cadangan lokal. */
const cloud: CloudIO = { upsert: pushCollection, remove: deleteRows };

const courseFromUrl = () =>
  COURSE_SCHEDULE.find((course) => course.code === new URLSearchParams(location.search).get("course")) ?? null;

const writeCourseUrl = (code: string | null) => {
  const url = new URL(location.href);
  if (code) url.searchParams.set("course", code);
  else url.searchParams.delete("course");
  // Tanpa perubahan URL tidak perlu entri riwayat baru, supaya tombol Kembali
  // tidak perlu ditekan berulang kali.
  if (url.href !== location.href) history.pushState({}, "", url);
};

/** Buang nilai ?course= yang tidak dikenal tanpa menambah entri riwayat. */
const dropUnknownCourseParam = () => {
  const params = new URLSearchParams(location.search);
  if (!params.get("course") || courseFromUrl()) return;
  const url = new URL(location.href);
  url.searchParams.delete("course");
  history.replaceState({}, "", url);
};

const initialCourse = courseFromUrl();

type CloudStatus = "loading" | "idle" | "saving" | "error";

export default function App() {
  /** Kunci AI hanya hidup di memori: baris pengaturan Supabase dapat dibaca publik. */
  const aiKeys = useRef({ localKey: DEFAULT_SETTINGS.ai.localKey });
  /** Satu penyimpanan pada satu waktu, dijaga di jalur data agar tombol di luar
   *  area konten (Copilot, tema) tidak bisa menyelinap dengan data lama. */
  const gate = useRef(createWriteGate());
  /** Menulis hanya boleh setelah data cloud sungguh termuat; kalau tidak, data
   *  awal statis bisa menimpa baris cloud yang sebenarnya. */
  const loaded = useRef(false);

  const [page, setPage] = useState<Page>(initialCourse ? "Mata Kuliah" : "Beranda");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(initialCourse);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState("");

  const [tasks, setTasksState] = useState<Task[]>([]);
  const [materials, setMaterialsState] = useState<Material[]>(INITIAL_MATERIALS);
  const [references, setReferencesState] = useState<ReferenceItem[]>(INITIAL_METNUM_REFERENCES);
  const [meetingNotes, setMeetingNotesState] = useState<MeetingNote[]>([]);
  const [settings, setSettingsState] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<Theme>("light");

  const [status, setStatus] = useState<CloudStatus>("loading");
  const [message, setMessage] = useState("Memuat data dari cloud…");
  const [ready, setReady] = useState(false);
  /** Selama menunggu cloud atau sebelum data termuat, tidak ada yang boleh diubah. */
  const locked = status === "loading" || status === "saving" || !ready;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const apply = (d: AppData) => {
    setTasksState(d.tasks);
    setMaterialsState(d.materials);
    setReferencesState(d.references);
    setMeetingNotesState(d.meetingNotes);
    const merged = { ...d.settings, ai: { ...d.settings.ai, ...aiKeys.current } };
    setSettingsState(merged);
    setTheme(merged.theme);
    loaded.current = true;
    setReady(true);
  };

  const load = async () => {
    setStatus("loading");
    setMessage("Memuat data dari cloud…");
    try {
      apply(await syncNow());
      setStatus("idle");
      setMessage("Data cloud dimuat.");
    } catch (e) {
      loaded.current = false;
      setReady(false);
      setStatus("error");
      setMessage(`Gagal memuat data cloud, penyuntingan dimatikan agar data cloud tidak tertimpa: ${errorText(e)}`);
    }
  };

  useEffect(() => {
    void load();
    dropUnknownCourseParam();
    const pop = () => {
      const course = courseFromUrl();
      setSelectedCourse(course);
      setPage(course ? "Mata Kuliah" : "Beranda");
      dropUnknownCourseParam();
    };
    addEventListener("popstate", pop);
    return () => removeEventListener("popstate", pop);
  }, []);

  /**
   * Alur simpan tunggal: kirim ke Supabase, tunggu konfirmasi, baru perbarui
   * tampilan. Karena state hanya berisi data yang sudah dikonfirmasi cloud,
   * tidak ada snapshot, antrean, atau pembatalan yang perlu dikelola.
   * `gate` menolak penyimpanan kedua yang tumpang-tindih, termasuk dari tombol
   * di luar area data, sehingga tidak ada penulisan berbasis data lama.
   */
  const save = async <T extends { id: string }>(
    kind: CollectionKind,
    previous: readonly T[],
    next: T[],
    commit: (value: T[]) => void,
  ) => {
    if (!loaded.current) {
      setStatus("error");
      setMessage("Data cloud belum termuat, perubahan tidak disimpan. Muat ulang dulu.");
      return;
    }
    const outcome = await gate.current.run(async () => {
      setStatus("saving");
      setMessage("Menyimpan ke cloud…");
      return commitCollection(kind, previous, next, cloud);
    });
    if (outcome === "busy") {
      setMessage("Penyimpanan lain sedang berjalan, coba lagi sesaat.");
      return;
    }
    if (outcome.ok) {
      commit(outcome.value);
      setStatus("idle");
      setMessage("Tersimpan di cloud.");
    } else {
      setStatus("error");
      setMessage(`Gagal menyimpan, data belum masuk cloud: ${outcome.error}`);
    }
  };

  const setTasks = (v: Task[]) => void save("tasks", tasks, v, setTasksState);
  const setMaterials = (v: Material[]) => void save("materials", materials, v, setMaterialsState);
  const setReferences = (v: ReferenceItem[]) => void save("references", references, v, setReferencesState);
  const setMeetingNotes = (v: MeetingNote[]) => void save("meeting_notes", meetingNotes, v, setMeetingNotesState);

  const setSettings = (v: UserSettings) => void (async () => {
    if (!loaded.current) {
      setStatus("error");
      setMessage("Data cloud belum termuat, pengaturan tidak disimpan. Muat ulang dulu.");
      return;
    }
    const outcome = await gate.current.run(async () => {
      setStatus("saving");
      setMessage("Menyimpan pengaturan…");
      return commitValue(pushSettings, v);
    });
    if (outcome === "busy") {
      setMessage("Penyimpanan lain sedang berjalan, coba lagi sesaat.");
      return;
    }
    if (outcome.ok) {
      aiKeys.current = { localKey: v.ai.localKey };
      setSettingsState(v);
      setTheme(v.theme);
      setStatus("idle");
      setMessage("Pengaturan tersimpan di cloud.");
    } else {
      setStatus("error");
      setMessage(`Gagal menyimpan pengaturan: ${outcome.error}`);
    }
  })();

  const toggleTheme = () => setSettings({ ...settings, theme: theme === "light" ? "dark" : "light" });

  const go = (p: Page) => {
    setPage(p);
    setSelectedCourse(null);
    writeCourseUrl(null);
  };

  const openCourse = (course: Course) => {
    setSelectedCourse(course);
    writeCourseUrl(course.code);
  };

  const closeCourse = () => {
    setSelectedCourse(null);
    writeCourseUrl(null);
  };

  const action = (a: SmartAction) => {
    if (a.type === "navigate") go(a.page);
    else if (a.type === "search") {
      setSearch(a.query);
      setPage(a.page);
    } else if (a.type === "add-task") {
      const dueAt = validDate(a.dueAt) ? new Date(a.dueAt).toISOString() : new Date(Date.now() + 86400000).toISOString();
      const courseCode = COURSE_SCHEDULE.some((c) => c.code === a.courseCode) ? a.courseCode! : COURSE_SCHEDULE[0].code;
      setTasks([
        ...tasks,
        {
          id: crypto.randomUUID(),
          title: a.title,
          description: "Ditambahkan melalui Copilot",
          courseCode,
          dueAt,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  let view;
  switch (page) {
    case "Mata Kuliah":
      view = selectedCourse ? (
        <CourseDetailView
          course={selectedCourse}
          tasks={tasks}
          setTasks={setTasks}
          materials={materials}
          setMaterials={setMaterials}
          references={references}
          setReferences={setReferences}
          notes={meetingNotes}
          setNotes={setMeetingNotes}
          onBack={closeCourse}
        />
      ) : (
        <CoursesView tasks={tasks} onSelect={openCourse} />
      );
      break;
    case "Jadwal":
      view = <ScheduleView goSilabus={go} />;
      break;
    case "Tugas":
      view = <TasksView tasks={tasks} setTasks={setTasks} />;
      break;
    case "Materi":
      view = (
        <MaterialsView
          items={materials}
          setItems={setMaterials}
          references={references}
          tasks={tasks}
          go={go}
          initialTab="koleksi"
        />
      );
      break;
    case "Alat Bantu":
      view = <ToolsView />;
      break;
    case "Referensi":
      view = <ReferencesView items={references} setItems={setReferences} />;
      break;
    case "Kalender":
      view = <CalendarView tasks={tasks} />;
      break;
    case "Pengaturan":
      view = <SettingsView settings={settings} setSettings={setSettings} reload={() => void load()} onSynced={apply} />;
      break;
    default:
      view = <DashboardView tasks={tasks} settings={settings} go={go} />;
  }

  return (
    <div className="app">
      <Sidebar page={page} setPage={go} open={drawer} onClose={() => setDrawer(false)} settings={settings} />
      <main>
        <Navbar settings={settings} theme={theme} onTheme={toggleTheme} onMenu={() => setDrawer(true)} />
        <div className="content">
          <p className={`cloud-status cloud-status--${status}`} role="status" aria-live="polite">
            <span aria-hidden="true" className="cloud-status__dot" />
            {message}
            {status === "error" && (
              <button type="button" className="cloud-status__retry" onClick={() => void load()}>
                Muat ulang data
              </button>
            )}
          </p>
          {search && (page === "Materi" || page === "Referensi") && (
            <div className="search-banner">
              Pencarian AI: <b>{search}</b>
              <button type="button" onClick={() => setSearch("")}>Tutup</button>
            </div>
          )}
          {/* Selama menunggu cloud atau sebelum data termuat, seluruh area data
              dinonaktifkan agar tidak ada perubahan berbasis data yang belum pasti. */}
          <div className="content-body" aria-busy={locked} inert={locked}>
            {view}
          </div>
        </div>
      </main>
      <MobileNav page={page} setPage={go} />
      <AIAssistantDrawer
        settings={settings}
        setSettings={setSettings}
        tasks={tasks}
        materials={materials}
        references={references}
        onAction={action}
      />
    </div>
  );
}
export { DEFAULT_SETTINGS };
