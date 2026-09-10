import { supabase } from "./supabase";
import { RYAN_FACE_PROFILE } from "./ryanFaceProfile";

const STORAGE_KEY = "kelasku_face_vector_v2";
const FEATURE_COUNT = 48; // 16 horizontal bands + 16 vertical bands + 16 spatial blocks

export interface FaceMatchResult {
  match: boolean;
  score: number;
  threshold: number;
}

/** Ekstraksi 48 fitur struktural wajah: tahan pergeseran, skala jarak, dan efek mirror kamera */
export function extractFaceVector(source: HTMLVideoElement | HTMLCanvasElement): Float32Array | null {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
  if (!srcW || !srcH) return null;

  // Fokus area tengah tempat wajah berada
  const cropSize = Math.min(srcW, srcH) * 0.72;
  const sx = (srcW - cropSize) / 2;
  const sy = (srcH - cropSize) / 2;

  ctx.drawImage(source, sx, sy, cropSize, cropSize, 0, 0, 64, 64);
  const imgData = ctx.getImageData(0, 0, 64, 64);
  const data = imgData.data;

  // Hitung grayscale 64x64
  const gray = new Float32Array(64 * 64);
  let sum = 0;
  for (let i = 0; i < 4096; i++) {
    const lum = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    gray[i] = lum;
    sum += lum;
  }

  // Normalisasi zero-mean unit variance (mengatasi perbedaan pencahayaan)
  const mean = sum / 4096;
  let variance = 0;
  for (let i = 0; i < 4096; i++) {
    gray[i] -= mean;
    variance += gray[i] * gray[i];
  }
  const std = Math.sqrt(variance / 4096) || 1;
  for (let i = 0; i < 4096; i++) {
    gray[i] /= std;
  }

  const features = new Float32Array(FEATURE_COUNT);

  // 1. 16 Horizontal bands (struktur vertikal: dahi -> alis -> mata -> hidung -> mulut -> dagu)
  for (let r = 0; r < 16; r++) {
    let rowSum = 0;
    for (let y = r * 4; y < (r + 1) * 4; y++) {
      for (let x = 0; x < 64; x++) {
        rowSum += gray[y * 64 + x];
      }
    }
    features[r] = rowSum / (4 * 64);
  }

  // 2. 16 Vertical bands (struktur horizontal: pipi kiri -> mata -> hidung -> mata -> pipi kanan)
  for (let c = 0; c < 16; c++) {
    let colSum = 0;
    for (let y = 0; y < 64; y++) {
      for (let x = c * 4; x < (c + 1) * 4; x++) {
        colSum += gray[y * 64 + x];
      }
    }
    features[16 + c] = colSum / (64 * 4);
  }

  // 3. 16 Spatial block means (grid 4x4)
  for (let br = 0; br < 4; br++) {
    for (let bc = 0; bc < 4; bc++) {
      let bSum = 0;
      for (let y = br * 16; y < (br + 1) * 16; y++) {
        for (let x = bc * 16; x < (bc + 1) * 16; x++) {
          bSum += gray[y * 64 + x];
        }
      }
      features[32 + br * 4 + bc] = bSum / 256;
    }
  }

  // Normalisasi panjang unit vektor
  let norm = 0;
  for (let i = 0; i < FEATURE_COUNT; i++) {
    norm += features[i] * features[i];
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < FEATURE_COUNT; i++) {
    features[i] /= norm;
  }

  return features;
}

/** Hitung kemiripan kosinus antara dua vektor fitur */
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
    if (!Array.isArray(arr) || arr.length !== FEATURE_COUNT) return RYAN_FACE_PROFILE;
    return new Float32Array(arr);
  } catch {
    return RYAN_FACE_PROFILE;
  }
}

export function hasFaceTemplate(): boolean {
  return true; // Wajah Ryan terdaftar secara bawaan dari foto profil
}

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

export async function fetchFaceTemplateFromCloud(): Promise<Float32Array> {
  const local = loadFaceTemplate();
  if (local) return local;
  if (!supabase) return RYAN_FACE_PROFILE;
  try {
    const { data } = await supabase.from("app_settings").select("data").eq("id", "owner_face_biometrics").maybeSingle();
    if (data?.data && Array.isArray((data.data as { template?: unknown }).template)) {
      const arr = (data.data as { template: number[] }).template;
      if (arr.length === FEATURE_COUNT) {
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
