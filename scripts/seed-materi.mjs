// Pemulihan sekali jalan: pindahkan arsip materi & referensi bawaan repo ke
// Supabase. Dipakai saat tabel cloud masih kosong (mis. database baru) supaya
// daftar materi tidak tampil kosong padahal arsipnya ada di repo.
//
// Pakai:
//   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/seed-materi.mjs
//
// Aman diulang: upsert berdasarkan id, jadi baris yang sudah ada hanya
// diperbarui, tidak diduplikasi. TIDAK menghapus apa pun.
import { INITIAL_MATERIALS } from "../src/lib/initialMaterials.ts";
import { INITIAL_METNUM_REFERENCES } from "../src/lib/initialReferences.ts";

const url = process.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, "");
const key = process.env.VITE_SUPABASE_ANON_KEY?.trim();
if (!url || !key) {
  console.error("VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY wajib diisi.");
  process.exit(1);
}

const row = (data) => ({ id: data.id, data, updated_at: data.updatedAt ?? data.createdAt ?? new Date().toISOString() });

async function seed(table, items) {
  const existing = await fetch(`${url}/rest/v1/${table}?select=id`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!existing.ok) throw new Error(`baca ${table}: ${existing.status} ${await existing.text()}`);
  const before = (await existing.json()).length;

  const res = await fetch(`${url}/rest/v1/${table}?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(items.map(row)),
  });
  if (!res.ok) throw new Error(`tulis ${table}: ${res.status} ${await res.text()}`);
  const written = (await res.json()).length;

  const after = await fetch(`${url}/rest/v1/${table}?select=id`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const total = (await after.json()).length;
  console.log(`${table}: sebelum ${before} baris, ditulis ${written}, sekarang ${total} baris`);
  return total;
}

const m = await seed("materials", INITIAL_MATERIALS);
const r = await seed("references", INITIAL_METNUM_REFERENCES);
if (m < INITIAL_MATERIALS.length || r < INITIAL_METNUM_REFERENCES.length) {
  console.error("Jumlah baris di cloud kurang dari arsip repo — periksa manual.");
  process.exit(1);
}
console.log("Pemulihan selesai.");
