import { supabase } from "./supabase";
import { RYAN_FACE_PROFILE } from "./ryanFaceProfile";

const STORAGE_KEY = "kelasku_face_vector_v1";
const GRID_SIZE = 48; // 48x48 = 2304 features

export interface FaceMatchResult {
  match: boolean;
  score: number;
  threshold: number;
}

/** Ekstraksi vektor wajah ternormalisasi dari elemen video atau canvas */
export function extractFaceVector(source: HTMLVideoElement | HTMLCanvasElement): Float32Array | null {
  const canvas = document.createElement("canvas");
  canvas.width = GRID_SIZE;
  canvas.height = GRID_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
  if (!srcW || !srcH) return null;

  // Fokus area tengah tempat wajah berada
  const cropSize = Math.min(srcW, srcH) * 0.72;
  const sx = (srcW - cropSize) / 2;
  const sy = (srcH - cropSize) / 2;

  ctx.drawImage(source, sx, sy, cropSize, cropSize, 0, 0, GRID_SIZE, GRID_SIZE);
  const imgData = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
  const data = imgData.data;

  const vector = new Float32Array(GRID_SIZE * GRID_SIZE);
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    vector[i] = lum;
    sum += lum;
  }

  // Normalisasi standar (zero-mean, unit variance)
  const mean = sum / vector.length;
  let variance = 0;
  for (let i = 0; i < vector.length; i++) {
    vector[i] -= mean;
    variance += vector[i] * vector[i];
  }
  const std = Math.sqrt(variance / vector.length) || 1;
  for (let i = 0; i < vector.length; i++) {
    vector[i] /= std;
  }

  return vector;
}

/** Hitung kemiripan kosinus antara dua vektor */
export function compareFaceVectors(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function saveFaceTemplate(vector: Float32Array): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(vector)));
  } catch (e) {
    console.error("Gagal simpan face template:", e);
  }
}

export function loadFaceTemplate(): Float32Array {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return RYAN_FACE_PROFILE;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length !== GRID_SIZE * GRID_SIZE) return RYAN_FACE_PROFILE;
    return new Float32Array(arr);
  } catch {
    return RYAN_FACE_PROFILE;
  }
}

export function hasFaceTemplate(): boolean {
  return true; // Wajah Ryan sudah terdaftar secara bawaan dari foto resmi
}

/** Sinkronkan template wajah Ryan ke Supabase cloud agar bisa diverifikasi dari HP mana pun */
export async function syncFaceTemplateToCloud(vector: Float32Array): Promise<boolean> {
  saveFaceTemplate(vector);
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("app_settings").upsert({
      id: "owner_face_biometrics",
      data: { template: Array.from(vector), owner: "Ryan Wardiana", updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    return !error;
  } catch {
    return false;
  }
}

/** Ambil template wajah Ryan dari Supabase jika ada pembaruan */
export async function fetchFaceTemplateFromCloud(): Promise<Float32Array> {
  const local = loadFaceTemplate();
  if (local) return local;
  if (!supabase) return RYAN_FACE_PROFILE;
  try {
    const { data } = await supabase.from("app_settings").select("data").eq("id", "owner_face_biometrics").maybeSingle();
    if (data?.data && Array.isArray((data.data as { template?: unknown }).template)) {
      const arr = (data.data as { template: number[] }).template;
      if (arr.length === GRID_SIZE * GRID_SIZE) {
        const vec = new Float32Array(arr);
        saveFaceTemplate(vec);
        return vec;
      }
    }
  } catch {
    return RYAN_FACE_PROFILE;
  }
  return RYAN_FACE_PROFILE;
}
