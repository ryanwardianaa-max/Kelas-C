import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("..", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");
const materials = read("src/lib/initialMaterials.ts");
const tools = read("src/lib/courseTools.ts");
const courseData = read("src/lib/mockData.ts");

for (let n = 1; n <= 16; n++) {
  const nn = String(n).padStart(2, "0");
  const path = `public/materi/KP21517001/pertemuan-${nn}/index.html`;
  assert.ok(fs.existsSync(new URL(path, root)), `materi pertemuan ${nn} wajib ada`);
  const html = read(path);
  assert.match(html, new RegExp(`Pertemuan ${nn}`));
  assert.match(html, /renderMathInElement/);
  assert.match(html, /left:'\$'/, "rumus inline $…$ wajib dirender");
  assert.match(html, /Latihan Mandiri/);
  assert.match(html, /Ringkasan/);
  assert.match(html, /Rinaldi Munir/);
  assert.doesNotMatch(html, /<pre|<code/);
  assert.doesNotMatch(html, /<h2>\d+\.\s+\d+\./, "nomor judul tidak boleh ganda");
  assert.match(materials, new RegExp(`mat-metnum-pertemuan-${nn}`));
}
assert.match(courseData, /code:'KP21517001'[\s\S]*?lecturer:'Linda Herawati, S\.Pd\., M\.Pd\.'/);
assert.doesNotMatch(courseData, /code:'KP21517001'[\s\S]*?lecturer:'Elis Nurhayati, M\.Pd\.'/);
assert.match(tools, /tool-lab-metode-numerik/);
assert.match(tools, /\/tools\/lab-metode-numerik\/index\.html/);
assert.ok(fs.existsSync(new URL("public/tools/lab-metode-numerik/core.js", root)));
assert.ok(fs.existsSync(new URL("public/tools/lab-metode-numerik/expression.js", root)));
const labHtml = read("public/tools/lab-metode-numerik/index.html");
assert.match(labHtml, /\.workspace\s*>\s*\*\s*\{\s*min-width:\s*0/, "grid laboratorium wajib dapat menyusut di ponsel");
assert.match(labHtml, /prefix==='pdb'&&key==='x0'\?'0':value/, "preset PDB wajib dimulai dari x = 0");
assert.match(labHtml, /const esc\s*=|function esc\s*\(/, "jalur error UI wajib escape pesan error");
assert.match(labHtml, /typeof v==='object'/, "nilai langkah bersarang tidak boleh tampil sebagai [object Object]");
for (const group of ["galat", "akar", "spl", "interpolasi", "turunan", "integrasi", "pdb"]) {
  assert.match(labHtml, new RegExp(`id==='${group}'`), `kelompok ${group} wajib memiliki grafik`);
}
assert.match(labHtml, /function calculationSteps\s*\(/, "setiap hasil wajib memiliki langkah hitung biasa");
assert.match(labHtml, /Langkah Perhitungan/, "judul langkah perhitungan wajib terlihat");
assert.match(labHtml, /r\.terms\.map/, "Taylor wajib menjabarkan setiap suku, bukan hanya tabel");
assert.match(labHtml, /Object\.is\(v,-0\)/, "hasil numerik tidak boleh menampilkan negatif nol");
for (const label of ["Perbesar", "Perkecil", "Atur ulang"]) {
  assert.match(labHtml, new RegExp(`aria-label="${label}`), `grafik wajib memiliki kontrol ${label.toLowerCase()}`);
}
assert.match(labHtml, /data-base-viewbox/, "grafik wajib dapat dikembalikan ke skala awal");
assert.match(labHtml, /class="grid-line"/, "grafik Kartesius wajib memiliki garis kisi");
assert.match(labHtml, /class="tick-label"/, "grafik Kartesius wajib memiliki angka skala");
assert.match(labHtml, /graphFmt/, "angka sumbu wajib memakai format ringkas");
assert.match(labHtml, /Math\.abs\(v\)<0\.0005\?0:v/, "angka sumbu yang membulat ke nol wajib tampil sebagai 0");
assert.match(labHtml, /length:5/, "angka sumbu wajib cukup renggang untuk layar ponsel");
assert.match(labHtml, /Geser tabel ke samping/, "tabel lebar wajib memiliki petunjuk geser");
assert.ok(fs.existsSync(new URL("public/tools/lab-metode-numerik/index.html", root)));
console.log("Metode Numerik complete integration: OK");
