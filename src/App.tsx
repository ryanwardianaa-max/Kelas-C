import { useEffect, useState } from "react";
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
import {
  DEFAULT_SETTINGS,
  getMaterials,
  getMeetingNotes,
  getReferences,
  filterNotDeleted,
  markDeletedId,
  getSettings,
  getTasks,
  getTheme,
  saveMaterials,
  saveMeetingNotes,
  saveReferences,
  saveSettings,
  saveTasks,
  validDate,
} from "./lib/storage";
import {
  flushPendingDeletes,
  pushCollection,
  pushSettings,
  queueDeletes,
  subscribeRealtime,
  syncNow,
  type CollectionKind,
} from "./lib/supabase";
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
const initialCourse = COURSE_SCHEDULE.find(
  (course) => course.code === new URLSearchParams(window.location.search).get("course"),
) || null;
export default function App() {
  const [page, setPage] = useState<Page>(initialCourse ? "Mata Kuliah" : "Beranda"),
    [drawer, setDrawer] = useState(false),
    [tasks, setTasksState] = useState<Task[]>(getTasks),
    [materials, setMaterialsState] = useState<Material[]>(getMaterials),
    [references, setReferencesState] = useState<ReferenceItem[]>(getReferences),
    [meetingNotes, setMeetingNotesState] =
      useState<MeetingNote[]>(getMeetingNotes),
    [selectedCourse, setSelectedCourse] = useState<Course | null>(initialCourse),
    [settings, setSettingsState] = useState<UserSettings>(getSettings),
    [theme, setTheme] = useState<Theme>(getTheme),
    [version, setVersion] = useState(0),
    [search, setSearch] = useState("");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const apply = (d: AppData) => {
    setTasksState(filterNotDeleted(d.tasks, "tasks"));
    setMaterialsState(filterNotDeleted(d.materials, "materials"));
    setReferencesState(filterNotDeleted(d.references, "references"));
    setMeetingNotesState(filterNotDeleted(d.meetingNotes, "meeting_notes"));
    setSettingsState(d.settings);
    setTheme(d.settings.theme);
  };
  useEffect(
    () =>
      subscribeRealtime(
        () =>
          void syncNow()
            .then(apply)
            .catch((error) =>
              console.error("Sinkronisasi realtime gagal.", error),
            ),
      ),
    [],
  );
  const reconcile = <T extends Task | Material | ReferenceItem | MeetingNote>(
    kind: CollectionKind,
    current: T[],
    next: T[],
  ) => {
    const now = new Date().toISOString(),
      previous = new Map(current.map((x) => [x.id, x])),
      n = next.map((x) => {
        const old = previous.get(x.id);
        if (!old) return { ...x, updatedAt: x.updatedAt || now };
        const changed =
          JSON.stringify({ ...old, updatedAt: undefined }) !==
          JSON.stringify({ ...x, updatedAt: undefined });
        return changed ? { ...x, updatedAt: now } : old;
      }),
      ids = new Set(n.map((x) => x.id)),
      removed = current.filter((x) => !ids.has(x.id)).map((x) => x.id);
    removed.forEach((id) => markDeletedId(id, kind));
    queueDeletes(kind, removed);
    void flushPendingDeletes().catch((error) =>
      console.error(`Penghapusan ${kind} tertunda.`, error),
    );
    void pushCollection(kind, n).catch((error) =>
      console.error(`Sinkronisasi ${kind} gagal.`, error),
    );
    return n;
  };
  const setTasks = (v: Task[]) => {
      const n = reconcile("tasks", tasks, v);
      setTasksState(n);
      saveTasks(n);
    },
    setMaterials = (v: Material[]) => {
      const n = reconcile("materials", materials, v);
      setMaterialsState(n);
      saveMaterials(n);
    },
    setReferences = (v: ReferenceItem[]) => {
      const n = reconcile("references", references, v);
      setReferencesState(n);
      saveReferences(n);
    },
    setMeetingNotes = (v: MeetingNote[]) => {
      const n = reconcile("meeting_notes", meetingNotes, v);
      setMeetingNotesState(n);
      saveMeetingNotes(n);
    },
    setSettings = (v: UserSettings) => {
      setSettingsState(v);
      setTheme(v.theme);
      saveSettings(v);
      void pushSettings(v).catch(() => {});
    };
  const reload = () => {
      apply({
        tasks: getTasks(),
        materials: getMaterials(),
        references: getReferences(),
        meetingNotes: getMeetingNotes(),
        settings: getSettings(),
      });
      setVersion((x) => x + 1);
    },
    toggleTheme = () =>
      setSettings({ ...settings, theme: theme === "light" ? "dark" : "light" }),
    go = (p: Page) => {
      setPage(p);
      if (p !== "Mata Kuliah") setSelectedCourse(null);
    };
  const action = (a: SmartAction) => {
    if (a.type === "navigate") setPage(a.page);
    else if (a.type === "search") {
      setSearch(a.query);
      setPage(a.page);
    } else if (a.type === "add-task") {
      const dueAt = validDate(a.dueAt)
          ? new Date(a.dueAt).toISOString()
          : new Date(Date.now() + 86400000).toISOString(),
        courseCode = COURSE_SCHEDULE.some((c) => c.code === a.courseCode)
          ? a.courseCode!
          : COURSE_SCHEDULE[0].code;
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
          onBack={() => setSelectedCourse(null)}
        />
      ) : (
        <CoursesView tasks={tasks} onSelect={setSelectedCourse} />
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
          key={`materials-${version}`}
          items={materials}
          setItems={setMaterials}
          references={references}
          tasks={tasks}
          go={go}
          initialTab={search ? "koleksi" : "koleksi"}
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
      view = (
        <SettingsView
          key={version}
          settings={settings}
          setSettings={setSettings}
          reload={reload}
          onSynced={apply}
        />
      );
      break;
    default:
      view = <DashboardView tasks={tasks} settings={settings} go={go} />;
  }
  return (
    <div className="app">
      <Sidebar
        page={page}
        setPage={setPage}
        open={drawer}
        onClose={() => setDrawer(false)}
        settings={settings}
      />
      <main>
        <Navbar
          settings={settings}
          theme={theme}
          onTheme={toggleTheme}
          onMenu={() => setDrawer(true)}
        />
        <div className="content">
          {search && (page === "Materi" || page === "Referensi") && (
            <div className="search-banner">
              Pencarian AI: <b>{search}</b>
              <button onClick={() => setSearch("")}>Tutup</button>
            </div>
          )}
          {view}
        </div>
      </main>
      <MobileNav page={page} setPage={setPage} />
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
