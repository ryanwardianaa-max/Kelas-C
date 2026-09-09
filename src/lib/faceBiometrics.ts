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

  // Ambil area tengah (tempat wajah berada di dalam oval pemindai)
  const cropSize = Math.min(srcW, srcH) * 0.7;
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
    // Luminansi grayscale standar ITU-R BT.601
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    vector[i] = lum;
    sum += lum;
  }

  // Normalisasi zero-mean unit variance (tahan perbedaan intensitas cahaya)
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
    console.error("Gagal menyimpan sampel wajah ke localStorage:", e);
  }
}

export function loadFaceTemplate(): Float32Array | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length !== GRID_SIZE * GRID_SIZE) return null;
    return new Float32Array(arr);
  } catch {
    return null;
  }
}

export function hasFaceTemplate(): boolean {
  return Boolean(loadFaceTemplate());
}

export function verifyFace(source: HTMLVideoElement | HTMLCanvasElement, threshold = 0.76): FaceMatchResult {
  const current = extractFaceVector(source);
  const stored = loadFaceTemplate();
  if (!current || !stored) {
    return { match: false, score: 0, threshold };
  }
  const score = compareFaceVectors(current, stored);
  return { match: score >= threshold, score, threshold };
}
