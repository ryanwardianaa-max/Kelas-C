import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const mock = readFileSync("src/lib/mockData.ts", "utf8");
const materials = readFileSync("src/lib/initialMaterials.ts", "utf8");
const tools = readFileSync("src/lib/courseTools.ts", "utf8");

const expectedTitles = [
  "Pertemuan 01 (Belum diisi)",
  "Landasan Himpunan dan Teorema De Morgan",
  "Teorema De Morgan, Inklusi Ganda, dan Aljabar Himpunan",
  "Sifat Terurut Baik dan Prinsip Induksi Matematika",
  "Bahan Baca: Induksi dari Basis Tertentu dan Contoh (Bartle 1.2.3–1.2.4)",
  "Bahan Baca: Induksi Kuat (Bartle 1.2.5)",
  "Bahan Baca: Himpunan Berhingga dan Tak Hingga (Bartle 1.3)",
  ...Array.from({ length: 9 }, (_, i) => `Pertemuan ${String(i + 8).padStart(2, "0")} (Belum diisi)`),
];
for (const title of expectedTitles) assert.ok(mock.includes(title), `judul silabus hilang: ${title}`);
assert.doesNotMatch(mock, /KP21517004:regular\(\['Aksioma Lapangan/);

for (let meeting = 2; meeting <= 7; meeting++) {
  const mm = String(meeting).padStart(2, "0");
  const path = `public/materi/KP21517004/pertemuan-${mm}/index.html`;
  assert.ok(existsSync(path), `${path} harus ada`);
  const html = readFileSync(path, "utf8");
  assert.ok(html.includes("/?course=KP21517004"), `${path} harus kembali ke detail matkul`);
  assert.match(html, /renderMathInElement/, `${path} harus merender matematika`);
}
const p3 = readFileSync("public/materi/KP21517004/pertemuan-03/index.html", "utf8");
assert.match(p3, /Teorema 1\.1\.4|De Morgan/);
assert.doesNotMatch(p3, /Prinsip Induksi Matematika/);
const p4 = readFileSync("public/materi/KP21517004/pertemuan-04/index.html", "utf8");
assert.match(p4, /1\.2\.1[^\n]*Sifat Terurut Baik|Sifat Terurut Baik[^\n]*1\.2\.1/);
assert.match(p4, /1\.2\.2[^\n]*Prinsip Induksi|Prinsip Induksi[^\n]*1\.2\.2/);
assert.match(p4, /1\^2\s*\+\s*3\^2/);
const p5 = readFileSync("public/materi/KP21517004/pertemuan-05/index.html", "utf8");
assert.match(p5, /1\.2\.3/);
assert.match(p5, /1\.2\.4/);
assert.match(p5, /Bahan Baca/);
const p6 = readFileSync("public/materi/KP21517004/pertemuan-06/index.html", "utf8");
assert.match(p6, /1\.2\.5/);
assert.match(p6, /Bahan Baca/);
const p7 = readFileSync("public/materi/KP21517004/pertemuan-07/index.html", "utf8");
assert.match(p7, /Bahan Baca/);
assert.match(p7, /1\.3/);

for (const id of [
  "mat-analisis-real-pertemuan-04",
  "mat-analisis-real-pertemuan-05",
  "mat-analisis-real-pertemuan-06",
  "mat-analisis-real-pertemuan-07",
  "tool-panduan-induksi",
]) assert.ok(materials.includes(id), `material belum terdaftar: ${id}`);
assert.match(tools, /id:\s*["']tool-panduan-induksi["']/);

const core = await import("../public/tools/panduan-induksi/core.js");
assert.equal(core.oddSquareSum(1), 1);
assert.equal(core.oddSquareSum(4), 84);
assert.deepEqual(core.inductionStep(3), { previous: 35, nextTerm: 49, combined: 84, target: 84 });
assert.throws(() => core.oddSquareSum(0), /bilangan asli/i);
assert.throws(() => core.oddSquareSum(1.5), /bilangan asli/i);
console.log("analisis real content regression: OK");
