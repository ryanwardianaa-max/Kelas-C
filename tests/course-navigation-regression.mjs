import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const detail = readFileSync("src/components/CourseDetailView.tsx", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

const courseTools = readFileSync("src/lib/courseTools.ts", "utf8");
for (const code of ["KP21517003", "KP21517001", "KP21517004", "KP21517007"]) {
  assert.match(courseTools, new RegExp(`courseCode:\\s*["']${code}["']`), `${code} harus memiliki alat bantu di halaman matkul`);
}
assert.match(detail, /window\.scrollTo\(\{\s*top:\s*0/, "halaman matkul harus kembali ke posisi teratas");
assert.match(app, /const courseFromUrl = \(\)[\s\S]*new URLSearchParams\(location\.search\)\.get\("course"\)/, "matkul harus dibaca dari URL");
assert.match(app, /const initialCourse = courseFromUrl\(\);[\s\S]*useState<Page>\(initialCourse \? "Mata Kuliah" : "Beranda"\)/, "URL materi harus langsung menampilkan detail matkul");
assert.match(app, /useState<Course \| null>\(initialCourse\)/, "detail matkul harus terpilih sejak awal");

for (const path of [
  "public/materi/KP21517003/pertemuan-03/index.html",
  "public/materi/KP21517004/pertemuan-02/index.html",
  "public/materi/KP21517004/pertemuan-03/index.html",
  "public/materi/KP21517007/pertemuan-02/index.html",
  "public/materi/KP21517007/pertemuan-03/index.html",
]) {
  const html = readFileSync(path, "utf8");
  const code = path.match(/KP\d+/)?.[0];
  assert.ok(html.includes(`/?course=${code}`), `${path} harus kembali ke detail matkul`);
}
assert.match(detail, /onBlur=\{\(e\) =>/, "catatan pertemuan harus disimpan saat fokus lepas, bukan tiap ketikan");
assert.doesNotMatch(detail, /onChange=\{\(e\) => saveNote/, "catatan tidak boleh memicu satu simpan cloud per huruf");
console.log("course navigation regression: OK");
