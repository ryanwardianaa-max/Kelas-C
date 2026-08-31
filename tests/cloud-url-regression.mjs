// Pemeriksaan struktural: memastikan desain "tunggu konfirmasi cloud" tetap utuh
// dan tidak ada penyimpanan lokal untuk data aplikasi.
// Uji perilakunya ada di tests/cloud-store.test.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const app = read("src/App.tsx");
const store = read("src/lib/cloudStore.ts");
const cloud = read("src/lib/supabase.ts");
const storage = read("src/lib/storage.ts");
const tools = read("src/components/ToolsView.tsx");
const detail = read("src/components/CourseDetailView.tsx");
const settings = read("src/components/SettingsView.tsx");

// Supabase satu-satunya penyimpanan data aplikasi.
assert.doesNotMatch(storage, /localStorage/, "storage tidak boleh memakai localStorage");
assert.doesNotMatch(cloud, /localStorage/, "lapisan cloud tidak boleh memakai localStorage");
assert.doesNotMatch(app, /localStorage/, "App tidak boleh memakai localStorage");
assert.doesNotMatch(store, /localStorage/, "cloudStore tidak boleh memakai localStorage");
assert.match(cloud, /Supabase belum dikonfigurasi/, "konfigurasi cloud yang hilang harus dinyatakan jelas");

// Tidak ada lagi mesin optimistis yang jadi sumber semua cacat sebelumnya.
for (const forbidden of ["writeQueues", "settingsQueue", "pendingDeletes", "snapshots", "subscribeRealtime"]) {
  assert.doesNotMatch(app, new RegExp(forbidden), `mekanisme optimistis '${forbidden}' harus hilang`);
}

// Tampilan hanya berubah setelah cloud mengonfirmasi.
assert.match(app, /return commitCollection\(kind, previous, next, cloud\)/, "koleksi harus lewat commitCollection");
assert.match(app, /if \(outcome\.ok\) \{\s*commit\(outcome\.value\)/, "commit hanya setelah hasil ok");
assert.match(app, /return commitValue\(pushSettings, v\)/, "pengaturan harus lewat commitValue");
assert.match(store, /await io\.upsert\(kind, next\);\s*await io\.remove\(/, "upsert harus sukses sebelum hapus");
assert.match(store, /Waktu tunggu cloud habis/, "penantian cloud harus dibatasi waktu");

// Penulisan bersamaan dicegah di jalur data (write gate), bukan hanya di tampilan,
// karena Copilot dan tombol tema berada di luar area konten.
assert.match(app, /const gate = useRef\(createWriteGate\(\)\)/, "harus ada penjaga tulis tunggal");
assert.match(app, /await gate\.current\.run\(/, "setiap simpan harus lewat penjaga tulis");
assert.match(app, /if \(outcome === "busy"\)/, "penyimpanan tumpang-tindih harus ditolak dengan jujur");
assert.match(store, /createWriteGate/, "penjaga tulis harus dapat diuji terpisah");

// Menulis dari data yang belum dikonfirmasi cloud harus ditolak, supaya data awal
// statis tidak menimpa baris Supabase yang sebenarnya.
assert.match(app, /if \(!loaded\.current\) \{/, "simpan harus ditolak sebelum data cloud termuat");
assert.match(app, /Data cloud belum termuat/, "penolakan harus dijelaskan ke pengguna");
assert.match(app, /const locked = status === "loading" \|\| status === "saving" \|\| !ready/, "area data terkunci sebelum siap");
assert.match(app, /inert=\{locked\}/, "area data harus nonaktif selama belum pasti");
assert.match(app, /aria-busy=\{locked\}/, "status sibuk harus diumumkan");
assert.match(app, /role="status" aria-live="polite"/, "status cloud harus diumumkan pembaca layar");
assert.match(app, /Gagal menyimpan, data belum masuk cloud/, "kegagalan harus dinyatakan jujur");

// Kunci API tidak boleh sampai ke baris Supabase yang dapat dibaca publik.
assert.match(cloud, /localKey: ""/, "kunci AI tidak boleh ditulis ke Supabase");
assert.match(app, /aiKeys\.current/, "kunci AI hanya hidup di memori");
assert.doesNotMatch(settings, /Kunci AI disimpan di Supabase/, "peringatan pengaturan harus akurat");

// Penghapusan banyak baris tetap satu pernyataan terverifikasi.
assert.match(cloud, /\.delete\(\)\.in\("id", ids\)\.select\("id"\)/, "hapus massal harus satu pernyataan");
assert.match(cloud, /tidak terverifikasi di cloud/, "hapus harus diverifikasi");

// Navigasi URL mata kuliah.
assert.match(app, /addEventListener\("popstate"/, "tombol Back peramban harus dipulihkan");
assert.match(app, /url\.searchParams\.set\("course", code\)/, "URL matkul harus mempertahankan pathname dan query lain");
assert.match(app, /history\.replaceState/, "URL matkul tak dikenal harus dinormalkan");
assert.doesNotMatch(app, /`\/\?course=/, "URL tidak boleh menghapus pathname deployment");
assert.match(app, /<Sidebar page=\{page\} setPage=\{go\}/, "sidebar harus membersihkan URL matkul");
assert.match(app, /<MobileNav page=\{page\} setPage=\{go\}/, "navigasi mobile harus membersihkan URL matkul");
assert.match(app, /if \(a\.type === "navigate"\) go\(a\.page\)/, "navigasi AI harus membersihkan URL matkul");

// Metadata alat bantu satu sumber.
assert.match(tools, /COURSE_TOOLS.*from "\.\.\/lib\/courseTools"/, "ToolsView memakai metadata bersama");
assert.match(detail, /COURSE_TOOLS.*from "\.\.\/lib\/courseTools"/, "CourseDetailView memakai metadata bersama");
assert.doesNotMatch(detail, /const COURSE_TOOLS/, "metadata tidak boleh diduplikasi");

// Kontrol cadangan lokal yang sudah usang tidak boleh kembali.
assert.doesNotMatch(settings, /exportDataAsJSON|importDataFromJSON|resetStorage|Reset data lokal/, "kontrol cadangan lokal harus hilang");
assert.match(settings, /role="status"[\s\S]*aria-live="polite"/, "status pengaturan harus diumumkan");

console.log("cloud/url structure: OK");
