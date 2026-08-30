// Akses tulis-baca Supabase. Satu-satunya tempat penyimpanan data aplikasi.
import { createClient } from "@supabase/supabase-js";
import type { AppData, Material, MeetingNote, ReferenceItem, Task, UserSettings } from "../types";
import type { CollectionKind } from "./cloudStore";
import { DEFAULT_SETTINGS, normalizeMaterial, normalizeMeetingNote, normalizeReference, normalizeSettings, normalizeTask, validDate } from "./storage";
export type { CollectionKind };
const url = import.meta.env.VITE_SUPABASE_URL?.trim(), key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const supabase = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
export const cloudConfigured = () => Boolean(supabase);
const required = () => {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi melalui environment. Perubahan tidak disimpan.");
  return supabase;
};
const updated = (x: { updatedAt?: string; createdAt?: string }) => validDate(x.updatedAt) ? x.updatedAt : validDate(x.createdAt) ? x.createdAt : new Date().toISOString();
const rows = <T extends { id: string; updatedAt?: string; createdAt?: string }>(v: readonly T[]) => v.map((data) => ({ id: data.id, data, updated_at: updated(data) }));
const normalizeRows = <T>(v: unknown, fn: (x: unknown) => T | null): T[] => Array.isArray(v) ? v.map((x) => typeof x === "object" && x ? fn((x as { data?: unknown }).data) : null).filter((x): x is T => x !== null) : [];

export async function syncNow(): Promise<AppData> {
  const db = required();
  const [t, m, r, n, s] = await Promise.all([
    db.from("tasks").select("data"),
    db.from("materials").select("data"),
    db.from("references").select("data"),
    db.from("meeting_notes").select("data"),
    db.from("app_settings").select("data").eq("id", "profile").maybeSingle(),
  ]);
  for (const x of [t, m, r, n, s]) if (x.error) throw x.error;
  return {
    tasks: normalizeRows(t.data, normalizeTask),
    materials: normalizeRows(m.data, normalizeMaterial),
    references: normalizeRows(r.data, normalizeReference),
    meetingNotes: normalizeRows(n.data, normalizeMeetingNote),
    settings: s.data ? normalizeSettings(s.data.data) : DEFAULT_SETTINGS,
  };
}

export async function pushCollection(kind: CollectionKind, value: readonly { id: string }[]) {
  if (!value.length) return;
  const { error } = await required().from(kind).upsert(rows(value as readonly (Task | Material | ReferenceItem | MeetingNote)[]), { onConflict: "id" });
  if (error) throw error;
}

/** Satu pernyataan hapus; keberhasilan diverifikasi dari baris yang benar-benar terhapus. */
export async function deleteRows(kind: CollectionKind, ids: string[]) {
  if (!ids.length) return;
  const { data, error } = await required().from(kind).delete().in("id", ids).select("id");
  if (error) throw error;
  const deleted = new Set(data?.map((x) => x.id));
  if (ids.some((id) => !deleted.has(id))) throw new Error(`Penghapusan ${kind} tidak terverifikasi di cloud.`);
}

/** Kunci API AI sengaja tidak pernah dikirim: baris ini dapat dibaca klien anonim. */
const publicSettings = (value: UserSettings) => {
  const safe = normalizeSettings(value);
  return { ...safe, ai: { ...safe.ai, localKey: "", cloudKey: "" } };
};

export async function pushSettings(value: UserSettings) {
  const { error } = await required().from("app_settings").upsert({ id: "profile", data: publicSettings(value), updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw error;
}

export async function checkCloud() {
  if (!supabase) return false;
  return !(await supabase.from("tasks").select("id").limit(1)).error;
}
