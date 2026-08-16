import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient,
} from "@supabase/supabase-js";
import {
  filterNotDeleted,
  getMaterials,
  getMeetingNotes,
  getReferences,
  getSettings,
  getTasks,
  markDeletedId,
  normalizeMaterial,
  normalizeMeetingNote,
  normalizeReference,
  normalizeSettings,
  normalizeTask,
  saveMaterials,
  saveMeetingNotes,
  saveReferences,
  saveSettings,
  saveTasks,
  validDate,
  type DeletedKind,
} from "./storage";
import type {
  AppData,
  Material,
  MeetingNote,
  ReferenceItem,
  Task,
  UserSettings,
} from "../types";
export type CollectionKind = DeletedKind;
type Tombstone = { kind: CollectionKind; id: string; deletedAt: string };
const TOMBSTONES_KEY = "kelasku_pending_deletes";
const url = import.meta.env.VITE_SUPABASE_URL?.trim(),
  key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;
export const cloudConfigured = () => Boolean(supabase);
export const localSnapshot = (): AppData => ({
  tasks: getTasks(),
  materials: getMaterials(),
  references: getReferences(),
  meetingNotes: getMeetingNotes(),
  settings: getSettings(),
});
function readTombstones(): Tombstone[] {
  try {
    return JSON.parse(localStorage.getItem(TOMBSTONES_KEY) || "[]").filter(
      (x: unknown): x is Tombstone =>
        Boolean(
          x &&
          typeof x === "object" &&
          ["tasks", "materials", "references", "meeting_notes"].includes(
            (x as Tombstone).kind,
          ) &&
          typeof (x as Tombstone).id === "string",
        ),
    );
  } catch {
    return [];
  }
}
function saveTombstones(value: Tombstone[]) {
  try {
    localStorage.setItem(TOMBSTONES_KEY, JSON.stringify(value));
  } catch {
    /* unavailable */
  }
}
export function queueDeletes(kind: CollectionKind, ids: string[]) {
  if (!ids.length) return;
  const queued = readTombstones(),
    now = new Date().toISOString(),
    keys = new Set(queued.map((x) => `${x.kind}:${x.id}`));
  for (const id of ids)
    if (id && !keys.has(`${kind}:${id}`)) {
      markDeletedId(id, kind);
      queued.push({ kind, id, deletedAt: now });
    }
  saveTombstones(queued);
}
export async function deleteRow(
  kind: CollectionKind,
  id: string,
  signal?: AbortSignal,
) {
  if (!supabase)
    throw new Error(
      "Supabase belum dikonfigurasi; penghapusan disimpan dalam antrean lokal.",
    );
  const { data, error } = await supabase
    .from(kind)
    .delete()
    .eq("id", id)
    .select("id")
    .abortSignal(signal ?? new AbortController().signal);
  if (error) throw error;
  if (!data?.some((row) => row.id === id))
    throw new Error(
      `DELETE ${kind}/${id} tidak terverifikasi (0 row atau RLS menolak).`,
    );
}
export async function flushPendingDeletes(signal?: AbortSignal) {
  const queued = readTombstones();
  if (!queued.length) return;
  if (!supabase)
    throw new Error(
      "Supabase belum dikonfigurasi; antrean penghapusan belum dikirim.",
    );
  const failed: Tombstone[] = [];
  for (const item of queued) {
    try {
      await deleteRow(item.kind, item.id, signal);
    } catch (error) {
      failed.push(item);
      console.error(
        `Gagal menghapus ${item.kind}/${item.id}; tetap dalam antrean.`,
        error,
      );
    }
  }
  saveTombstones(failed);
  if (failed.length)
    throw new Error(`${failed.length} penghapusan Supabase masih tertunda.`);
}
const updated = (x: { updatedAt?: string; createdAt?: string }) =>
  validDate(x.updatedAt)
    ? x.updatedAt
    : validDate(x.createdAt)
      ? x.createdAt
      : "";
const merge = <
  T extends { id: string; updatedAt?: string; createdAt?: string },
>(
  kind: CollectionKind,
  local: T[],
  remote: T[],
) =>
  filterNotDeleted(
    [
      ...new Map(
        [...local, ...remote]
          .sort((a, b) => updated(a).localeCompare(updated(b)))
          .map((x) => [x.id, x]),
      ).values(),
    ],
    kind,
  );
const rows = <T extends { id: string; updatedAt?: string; createdAt?: string }>(
  kind: CollectionKind,
  value: T[],
) =>
  filterNotDeleted(value, kind)
    .filter((x) => x.id)
    .map((item) => ({
      id: item.id,
      data: item,
      updated_at: updated(item) || new Date().toISOString(),
    }));
async function upsert(
  kind: CollectionKind,
  value: unknown[],
  signal?: AbortSignal,
) {
  if (!supabase || !value.length) return;
  const { error } = await supabase
    .from(kind)
    .upsert(value, { onConflict: "id" })
    .abortSignal(signal ?? new AbortController().signal);
  if (error) throw error;
}
const normalizeRows = <T>(value: unknown, fn: (x: unknown) => T | null): T[] =>
  Array.isArray(value)
    ? value
        .map((row) =>
          typeof row === "object" && row !== null
            ? fn((row as { data?: unknown }).data)
            : null,
        )
        .filter((x): x is T => x !== null)
    : [];
const optionalMissing = (error: unknown) => {
  const e = error as { code?: string; message?: string };
  return (
    e?.code === "42P01" ||
    /meeting_notes|schema cache|does not exist/i.test(e?.message || "")
  );
};
let flight: Promise<AppData> | null = null;
async function performSync(): Promise<AppData> {
  if (!supabase)
    throw new Error(
      "Supabase belum dikonfigurasi. Data tetap aman secara lokal.",
    );
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 4500);
  const { signal } = controller;
  try {
    try {
      await flushPendingDeletes(signal);
    } catch (error) {
      if (signal.aborted)
        throw new Error(
          "Batas waktu koneksi cloud tercapai. Menggunakan data lokal.",
        );
      console.error("Sinkronisasi melanjutkan dengan tombstone aktif.", error);
    }
    const local = localSnapshot(),
      [t, m, r, s, n] = await Promise.all([
        supabase.from("tasks").select("data").abortSignal(signal),
        supabase.from("materials").select("data").abortSignal(signal),
        supabase.from("references").select("data").abortSignal(signal),
        supabase
          .from("app_settings")
          .select("data")
          .eq("id", "profile")
          .abortSignal(signal)
          .maybeSingle(),
        supabase.from("meeting_notes").select("data").abortSignal(signal),
      ]);
    if (signal.aborted)
      throw new Error(
        "Batas waktu koneksi cloud tercapai. Menggunakan data lokal.",
      );
    for (const result of [t, m, r, s]) if (result.error) throw result.error;
    if (n.error && !optionalMissing(n.error)) throw n.error;
    const remoteSettings =
      typeof s.data === "object" && s.data !== null
        ? (s.data as { data?: unknown }).data
        : undefined;
    const data: AppData = {
      tasks: merge("tasks", local.tasks, normalizeRows(t.data, normalizeTask)),
      materials: merge(
        "materials",
        local.materials,
        normalizeRows(m.data, normalizeMaterial),
      ),
      references: merge(
        "references",
        local.references,
        normalizeRows(r.data, normalizeReference),
      ),
      meetingNotes: merge(
        "meeting_notes",
        local.meetingNotes,
        n.error ? [] : normalizeRows(n.data, normalizeMeetingNote),
      ),
      settings: remoteSettings
        ? normalizeSettings(remoteSettings)
        : local.settings,
    };
    await Promise.all([
      upsert("tasks", rows("tasks", data.tasks), signal),
      upsert("materials", rows("materials", data.materials), signal),
      upsert("references", rows("references", data.references), signal),
      n.error
        ? Promise.resolve()
        : upsert(
            "meeting_notes",
            rows("meeting_notes", data.meetingNotes),
            signal,
          ),
      supabase
        .from("app_settings")
        .upsert(
          {
            id: "profile",
            data: data.settings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .abortSignal(signal)
        .then(({ error }) => {
          if (error) throw error;
        }),
    ]);
    if (signal.aborted)
      throw new Error(
        "Batas waktu koneksi cloud tercapai. Menggunakan data lokal.",
      );
    saveTasks(data.tasks);
    saveMaterials(data.materials);
    saveReferences(data.references);
    saveMeetingNotes(data.meetingNotes);
    saveSettings(data.settings);
    return {
      ...data,
      tasks: filterNotDeleted(data.tasks, "tasks"),
      materials: filterNotDeleted(data.materials, "materials"),
      references: filterNotDeleted(data.references, "references"),
      meetingNotes: filterNotDeleted(data.meetingNotes, "meeting_notes"),
    };
  } finally {
    window.clearTimeout(timer);
  }
}
export function syncNow() {
  if (!flight)
    flight = performSync().finally(() => {
      flight = null;
    });
  return flight;
}
export async function pushCollection<
  T extends Task | Material | ReferenceItem | MeetingNote,
>(kind: CollectionKind, value: T[]) {
  if (supabase)
    try {
      await upsert(kind, rows(kind, value));
    } catch (error) {
      if (kind !== "meeting_notes" || !optionalMissing(error)) throw error;
    }
}
export async function pushSettings(value: UserSettings) {
  if (!supabase) return;
  const { error } = await supabase
    .from("app_settings")
    .upsert(
      {
        id: "profile",
        data: normalizeSettings(value),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  if (error) throw error;
}
export function subscribeRealtime(onChange: () => void): () => void {
  if (!supabase) return () => {};
  let timer: number | undefined;
  const notify = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(onChange, 350);
  };
  let channel: RealtimeChannel = supabase.channel("kelasku-realtime");
  for (const table of [
    "tasks",
    "materials",
    "references",
    "meeting_notes",
    "app_settings",
  ])
    channel = channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      notify,
    );
  channel = channel.subscribe();
  return () => {
    window.clearTimeout(timer);
    void supabase?.removeChannel(channel);
  };
}
export async function checkCloud() {
  if (!supabase) return false;
  const { error } = await supabase.from("tasks").select("id").limit(1);
  return !error;
}
