import type {
  BackupData,
  Material,
  MeetingNote,
  ReferenceCategory,
  ReferenceItem,
  Task,
  Theme,
  UserSettings,
} from "../types";
import { INITIAL_METNUM_REFERENCES } from "./initialReferences";
export type DeletedKind =
  "tasks" | "materials" | "references" | "meeting_notes";
type DeletedEntry = { kind: DeletedKind; id: string; deletedAt: string };
const K = {
  tasks: "kelasku_tasks",
  materials: "kelasku_materials",
  references: "kelasku_references",
  meetingNotes: "kelasku_meeting_notes",
  settings: "kelasku_settings",
  theme: "kelasku_theme",
  deleted: "kelasku_deleted_ids",
} as const;
export const DEFAULT_SETTINGS: UserSettings = {
  name: "",
  nim: "",
  email: "",
  program: "Pendidikan Matematika",
  semester: "7",
  className: "C",
  target: "",
  notifications: false,
  sound: false,
  theme: "light",
  ai: {
    provider: "local",
    localEndpoint:
      import.meta.env.VITE_NINEROUTER_BASE_URL || "http://127.0.0.1:20128/v1",
    localKey: import.meta.env.VITE_NINEROUTER_API_KEY || "",
    localModel: import.meta.env.VITE_NINEROUTER_MODEL || "cx/gpt-5.6-sol",
    cloudEndpoint:
      import.meta.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1",
    cloudKey: import.meta.env.VITE_OPENAI_API_KEY || "",
    cloudModel: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini",
    timeoutMs: 20000,
  },
};
const object = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;
const text = (x: unknown, fallback = "") =>
  typeof x === "string" ? x : fallback;
const meeting = (x: unknown) =>
  typeof x === "number" && Number.isInteger(x) && x >= 1 && x <= 16
    ? x
    : undefined;
export const validDate = (x: unknown): x is string =>
  typeof x === "string" && x.trim() !== "" && !Number.isNaN(Date.parse(x));
const iso = (x: unknown, fallback: string) =>
  validDate(x) ? new Date(x).toISOString() : fallback;
const read = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
};
const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};
export const getDeletedIds = (): DeletedEntry[] => {
  const raw = read(K.deleted);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((x): DeletedEntry[] => {
    if (typeof x === "string") return [{ kind: "tasks", id: x, deletedAt: "" }];
    return object(x) &&
      ["tasks", "materials", "references", "meeting_notes"].includes(
        text(x.kind),
      ) &&
      text(x.id)
      ? [
          {
            kind: x.kind as DeletedKind,
            id: text(x.id),
            deletedAt: text(x.deletedAt),
          },
        ]
      : [];
  });
};
export function markDeletedId(id: string, kind: DeletedKind = "tasks") {
  if (!id) return;
  const entries = getDeletedIds();
  if (!entries.some((x) => x.kind === kind && x.id === id))
    save(K.deleted, [
      ...entries,
      { kind, id, deletedAt: new Date().toISOString() },
    ]);
}
export function isDeletedId(id: string, kind: DeletedKind = "tasks") {
  return getDeletedIds().some((x) => x.kind === kind && x.id === id);
}
export function filterNotDeleted<T extends { id: string }>(
  items: T[],
  kind: DeletedKind = "tasks",
) {
  const ids = new Set(
    getDeletedIds()
      .filter((x) => x.kind === kind)
      .map((x) => x.id),
  );
  return items.filter((x) => !ids.has(x.id));
}
export const normalizeTask = (x: unknown): Task | null => {
  if (!object(x) || !text(x.id) || !text(x.title) || !validDate(x.dueAt))
    return null;
  const now = new Date().toISOString();
  return {
    id: text(x.id),
    title: text(x.title),
    courseCode: text(x.courseCode, "UMUM"),
    meetingNo: meeting(x.meetingNo),
    description: text(x.description),
    dueAt: iso(x.dueAt, now),
    completed: x.completed === true,
    createdAt: iso(x.createdAt, now),
    updatedAt: validDate(x.updatedAt) ? iso(x.updatedAt, now) : undefined,
  };
};
export const normalizeMaterial = (x: unknown): Material | null => {
  if (!object(x) || !text(x.id) || !text(x.title)) return null;
  const types = ["Catatan", "Dokumen", "Slide", "Video"] as const,
    now = new Date().toISOString();
  return {
    id: text(x.id),
    title: text(x.title),
    courseCode: text(x.courseCode, "UMUM"),
    meetingNo: meeting(x.meetingNo),
    type: types.includes(x.type as (typeof types)[number])
      ? (x.type as Material["type"])
      : "Catatan",
    description: text(x.description),
    url: text(x.url),
    createdAt: iso(x.createdAt, now),
    updatedAt: validDate(x.updatedAt) ? iso(x.updatedAt, now) : undefined,
  };
};
const categories: ReferenceCategory[] = [
  "Jurnal",
  "E-Book",
  "Website",
  "Drive/File",
  "Video",
  "Catatan",
];
export const normalizeReference = (x: unknown): ReferenceItem | null => {
  if (!object(x) || !text(x.id) || !text(x.title)) return null;
  const now = new Date().toISOString();
  return {
    id: text(x.id),
    title: text(x.title),
    courseCode: text(x.courseCode, "UMUM"),
    meetingNo: meeting(x.meetingNo),
    category: categories.includes(x.category as ReferenceCategory)
      ? (x.category as ReferenceCategory)
      : "Catatan",
    urlOrPath: text(x.urlOrPath),
    description: text(x.description),
    tags: Array.isArray(x.tags)
      ? x.tags.filter((v): v is string => typeof v === "string")
      : [],
    createdAt: iso(x.createdAt, now),
    updatedAt: validDate(x.updatedAt) ? iso(x.updatedAt, now) : undefined,
  };
};
export const normalizeMeetingNote = (x: unknown): MeetingNote | null => {
  if (!object(x) || !text(x.id) || !text(x.courseCode) || !meeting(x.meetingNo))
    return null;
  return {
    id: text(x.id),
    courseCode: text(x.courseCode),
    meetingNo: meeting(x.meetingNo)!,
    content: text(x.content),
    updatedAt: iso(x.updatedAt, new Date().toISOString()),
  };
};
const list = <T>(x: unknown, normalize: (v: unknown) => T | null): T[] =>
  Array.isArray(x) ? x.map(normalize).filter((v): v is T => v !== null) : [];
export const normalizeSettings = (x: unknown): UserSettings => {
  const v = object(x) ? x : {},
    rawAi = object(v.ai) ? v.ai : {};
  return {
    name: text(v.name),
    nim: text(v.nim),
    email: text(v.email),
    program: text(v.program, DEFAULT_SETTINGS.program),
    semester: text(v.semester, DEFAULT_SETTINGS.semester),
    className: text(v.className, DEFAULT_SETTINGS.className),
    target: text(v.target),
    notifications: v.notifications === true,
    sound: v.sound === true,
    theme: v.theme === "dark" ? "dark" : "light",
    ai: {
      provider: rawAi.provider === "cloud" ? "cloud" : "local",
      localEndpoint: text(
        rawAi.localEndpoint,
        DEFAULT_SETTINGS.ai.localEndpoint,
      ),
      localKey: text(rawAi.localKey),
      localModel: text(rawAi.localModel, DEFAULT_SETTINGS.ai.localModel),
      cloudEndpoint: text(
        rawAi.cloudEndpoint,
        DEFAULT_SETTINGS.ai.cloudEndpoint,
      ),
      cloudKey: text(rawAi.cloudKey),
      cloudModel: text(rawAi.cloudModel, DEFAULT_SETTINGS.ai.cloudModel),
      timeoutMs:
        typeof rawAi.timeoutMs === "number" &&
        rawAi.timeoutMs >= 1000 &&
        rawAi.timeoutMs <= 120000
          ? rawAi.timeoutMs
          : DEFAULT_SETTINGS.ai.timeoutMs,
    },
  };
};
export const getTasks = () =>
  filterNotDeleted(list(read(K.tasks), normalizeTask), "tasks");
export const saveTasks = (v: Task[]) =>
  save(K.tasks, filterNotDeleted(list(v, normalizeTask), "tasks"));
export const getMaterials = () =>
  filterNotDeleted(list(read(K.materials), normalizeMaterial), "materials");
export const saveMaterials = (v: Material[]) =>
  save(K.materials, filterNotDeleted(list(v, normalizeMaterial), "materials"));
export const getReferences = () => {
  const stored = list(read(K.references), normalizeReference);
  const merged = [
    ...new Map(
      [...INITIAL_METNUM_REFERENCES, ...stored].map((item) => [item.id, item]),
    ).values(),
  ];
  return filterNotDeleted(merged, "references");
};
export const saveReferences = (v: ReferenceItem[]) =>
  save(
    K.references,
    filterNotDeleted(list(v, normalizeReference), "references"),
  );
export const getMeetingNotes = () =>
  filterNotDeleted(
    list(read(K.meetingNotes), normalizeMeetingNote),
    "meeting_notes",
  );
export const saveMeetingNotes = (v: MeetingNote[]) =>
  save(
    K.meetingNotes,
    filterNotDeleted(list(v, normalizeMeetingNote), "meeting_notes"),
  );
export const getSettings = () => normalizeSettings(read(K.settings));
export const saveSettings = (v: UserSettings) => {
  const safe = normalizeSettings(v);
  save(K.settings, safe);
  try {
    localStorage.setItem(K.theme, safe.theme);
  } catch {
    /* storage unavailable */
  }
};
export const getTheme = (): Theme => {
  try {
    return localStorage.getItem(K.theme) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};
export function exportDataAsJSON() {
  const settings = getSettings();
  settings.ai = { ...settings.ai, localKey: "", cloudKey: "" };
  const data: BackupData = {
    version: 4,
    exportedAt: new Date().toISOString(),
    tasks: getTasks(),
    materials: getMaterials(),
    references: getReferences(),
    meetingNotes: getMeetingNotes(),
    settings,
  };
  const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = `kelasku-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
export function importDataFromJSON(raw: string) {
  const d: unknown = JSON.parse(raw);
  if (
    !object(d) ||
    !Array.isArray(d.tasks) ||
    !Array.isArray(d.materials) ||
    !Array.isArray(d.references) ||
    !object(d.settings)
  )
    throw new Error("Format cadangan tidak valid");
  saveTasks(filterNotDeleted(list(d.tasks, normalizeTask), "tasks"));
  saveMaterials(
    filterNotDeleted(list(d.materials, normalizeMaterial), "materials"),
  );
  saveReferences(
    filterNotDeleted(list(d.references, normalizeReference), "references"),
  );
  saveMeetingNotes(
    filterNotDeleted(
      list(d.meetingNotes, normalizeMeetingNote),
      "meeting_notes",
    ),
  );
  const imported = normalizeSettings(d.settings),
    current = getSettings();
  imported.ai.localKey = current.ai.localKey;
  imported.ai.cloudKey = current.ai.cloudKey;
  saveSettings(imported);
}
export function resetStorage() {
  [
    K.tasks,
    K.materials,
    K.references,
    K.meetingNotes,
    K.settings,
    K.theme,
  ].forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* storage unavailable */
    }
  });
}
