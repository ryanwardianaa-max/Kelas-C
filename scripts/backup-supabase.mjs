// Salin seluruh isi tabel Supabase ke satu berkas JSON di dalam repo, supaya
// ada versi lama yang bisa dipulihkan kalau data di cloud tertimpa atau
// terhapus. Git yang menyimpan riwayatnya; tidak perlu layanan tambahan.
//
// Pakai:
//   set -a && . ./.env.local && set +a && node scripts/backup-supabase.mjs
//
// Hanya membaca. Tidak pernah menulis ke Supabase.
//
// ponytail: satu berkas per hari, ditimpa kalau dijalankan dua kali sehari
// (riwayat per commit tetap ada di Git). Pindah ke Storage/pg_dump kalau data
// sudah lebih besar dari beberapa MB.
import { mkdir, writeFile } from "node:fs/promises";

const TABLES = ["tasks", "materials", "references", "meeting_notes", "app_settings"];
const OUT_DIR = "backup";

const url = process.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, "");
const key = process.env.VITE_SUPABASE_ANON_KEY?.trim();
if (!url || !key) {
  console.error("VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY wajib diisi.");
  process.exit(1);
}

const dump = {};
for (const table of TABLES) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.error(`baca ${table}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const rows = await res.json();
  dump[table] = rows;
  console.log(`${table}: ${rows.length} baris`);
}

const total = Object.values(dump).reduce((n, rows) => n + rows.length, 0);
if (!total) {
  // Cloud kosong berarti ada yang salah (jaringan, kebijakan, proyek keliru).
  // Menyimpannya akan menimpa cadangan bagus dengan berkas kosong.
  console.error("Semua tabel kosong — cadangan tidak ditulis. Periksa koneksi dan kunci.");
  process.exit(1);
}

const stamp = new Date().toISOString().slice(0, 10);
const path = `${OUT_DIR}/supabase-${stamp}.json`;
await mkdir(OUT_DIR, { recursive: true });
await writeFile(path, JSON.stringify({ takenAt: new Date().toISOString(), tables: dump }, null, 2), "utf8");
console.log(`Cadangan ditulis: ${path} (${total} baris). Commit berkas ini agar riwayatnya tersimpan.`);
