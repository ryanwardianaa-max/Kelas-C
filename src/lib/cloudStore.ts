// Satu jalur simpan: kirim ke cloud, tunggu konfirmasi, baru tampilan diperbarui.
// Tidak ada antrean, snapshot optimistis, atau pembatalan — kegagalan cukup
// dilaporkan dan tampilan dibiarkan apa adanya.
export type CollectionKind = "tasks" | "materials" | "references" | "meeting_notes";
export type Outcome<T> = { ok: true; value: T } | { ok: false; error: string };
export type CloudIO = {
  upsert: (kind: CollectionKind, rows: readonly { id: string }[]) => Promise<void>;
  remove: (kind: CollectionKind, ids: string[]) => Promise<void>;
};

export const SAVE_TIMEOUT_MS = 15000;

/**
 * Supabase melempar `PostgrestError` — objek biasa, bukan `Error`. Tanpa
 * penanganan ini penyebab asli hilang dan pengguna hanya melihat
 * "Kesalahan tidak diketahui", sehingga masalah tidak bisa diperbaiki.
 */
export const errorText = (e: unknown) => {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "string" && e) return e;
  if (typeof e === "object" && e) {
    const { message, code, hint, details } = e as Record<string, unknown>;
    const parts = [message, details, hint].filter((x): x is string => typeof x === "string" && x !== "");
    if (parts.length) return code ? `${parts.join(" — ")} (kode ${String(code)})` : parts.join(" — ");
  }
  return "Kesalahan tidak diketahui.";
};

/** Mencegah tampilan terkunci selamanya bila cloud tidak pernah menjawab. */
export async function withTimeout<T>(work: Promise<T>, ms = SAVE_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Waktu tunggu cloud habis, status penyimpanan belum pasti.")), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export const removedIds = <T extends { id: string }>(previous: readonly T[], next: readonly T[]) => {
  const kept = new Set(next.map((x) => x.id));
  return previous.filter((x) => !kept.has(x.id)).map((x) => x.id);
};

/**
 * Penjaga tulis: hanya satu penyimpanan boleh berjalan pada satu waktu.
 * Penjagaan ada di jalur data, bukan di tampilan, sehingga tombol mana pun —
 * termasuk yang di luar area konten — tidak dapat memulai penyimpanan kedua
 * dengan data lama.
 */
export function createWriteGate() {
  let busy = false;
  return {
    get busy() {
      return busy;
    },
    async run<T>(work: () => Promise<T>): Promise<T | "busy"> {
      if (busy) return "busy";
      busy = true;
      try {
        return await work();
      } finally {
        busy = false;
      }
    },
  };
}

/**
 * Simpan koleksi: tulis baris baru lebih dulu, lalu hapus baris yang hilang.
 * `ok` hanya benar bila Supabase mengonfirmasi keduanya, sehingga pemanggil
 * boleh memperbarui tampilan tanpa risiko klaim "tersimpan" yang palsu.
 */
export async function commitCollection<T extends { id: string }>(
  kind: CollectionKind,
  previous: readonly T[],
  next: T[],
  io: CloudIO,
  timeoutMs = SAVE_TIMEOUT_MS,
): Promise<Outcome<T[]>> {
  try {
    await withTimeout(
      (async () => {
        await io.upsert(kind, next);
        await io.remove(kind, removedIds(previous, next));
      })(),
      timeoutMs,
    );
    return { ok: true, value: next };
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

/** Versi nilai tunggal (pengaturan) dengan aturan konfirmasi yang sama. */
export async function commitValue<T>(
  write: (value: T) => Promise<void>,
  value: T,
  timeoutMs = SAVE_TIMEOUT_MS,
): Promise<Outcome<T>> {
  try {
    await withTimeout(write(value), timeoutMs);
    return { ok: true, value };
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}
