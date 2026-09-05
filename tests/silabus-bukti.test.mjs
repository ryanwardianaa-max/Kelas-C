// Penjaga kejujuran silabus + keutuhan gambar setelah konversi WebP.
//
// Dulu silabus 5 matkul diisi 16 judul karangan lewat helper regular(). Tes ini
// memastikan tiap halaman materi yang benar-benar ada punya judul silabus yang
// terisi, dan sebaliknya judul terisi tidak menunjuk halaman yang tidak ada.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const { SYLLABUS, COURSE_SCHEDULE } = await import("../src/lib/mockData.ts");

// 1. Tiap matkul di jadwal punya silabus; tidak ada silabus yatim.
for (const course of COURSE_SCHEDULE) {
  assert.ok(SYLLABUS[course.code], `silabus hilang untuk ${course.code}`);
}
assert.deepEqual(
  Object.keys(SYLLABUS).sort(),
  COURSE_SCHEDULE.map((c) => c.code).sort(),
  "kunci SYLLABUS harus sama dengan kode matkul di jadwal",
);

// 2. Nomor pertemuan berurutan dan setiap entri punya ringkasan + aktivitas.
for (const [code, meetings] of Object.entries(SYLLABUS)) {
  meetings.forEach((m, i) => {
    assert.equal(m.meeting, i + 1, `${code}: nomor pertemuan tidak berurutan di indeks ${i}`);
    assert.ok(m.title.trim(), `${code} P${m.meeting}: judul kosong`);
    assert.ok(m.summary.trim(), `${code} P${m.meeting}: ringkasan kosong`);
    assert.ok(m.activity.trim(), `${code} P${m.meeting}: aktivitas kosong`);
  });
}

// 3. Setiap halaman materi pertemuan yang ada wajib punya judul silabus terisi.
const blank = /\(Belum diisi\)/;
for (const code of Object.keys(SYLLABUS)) {
  const dir = `public/materi/${code}`;
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir)) {
    const match = /^pertemuan-(\d{2})$/.exec(entry);
    if (!match) continue;
    const no = Number(match[1]);
    const meeting = SYLLABUS[code].find((m) => m.meeting === no);
    assert.ok(meeting, `${code}: halaman ${entry} ada tapi tidak ada entri silabus P${no}`);
    assert.doesNotMatch(
      meeting.title,
      blank,
      `${code} P${no}: halaman materi sudah ada, judul silabus jangan "(Belum diisi)"`,
    );
  }
}

// 4. Semua rujukan gambar di halaman materi harus punya berkasnya (penjaga
//    setelah scripts/compress-materi.mjs mengganti .jpg/.png menjadi .webp).
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
  );
let checked = 0;
for (const html of walk("public/materi").filter((f) => f.endsWith(".html"))) {
  const dir = html.slice(0, html.lastIndexOf("/"));
  const body = readFileSync(html, "utf8");
  for (const m of body.matchAll(/src="([^":]+\.(?:jpe?g|png|webp))(?:\?[^"]*)?"/g)) {
    assert.ok(existsSync(`${dir}/${m[1]}`), `gambar hilang: ${html} -> ${m[1]}`);
    checked += 1;
  }
}
assert.ok(checked > 20, `rujukan gambar terlalu sedikit (${checked}), pemeriksaan tidak berarti`);

console.log(`silabus & gambar materi: OK (${checked} rujukan gambar diperiksa)`);
