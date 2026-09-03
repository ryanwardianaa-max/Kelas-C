import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const materials = readFileSync("src/lib/initialMaterials.ts", "utf8");
const id = "mat-mateko-pertemuan-04";
const url = "/materi/KP21517007/pertemuan-04/index.html";

assert.match(materials, new RegExp(`id:\\s*"${id}"[\\s\\S]*courseCode:\\s*"KP21517007"[\\s\\S]*meetingNo:\\s*4[\\s\\S]*url:\\s*"${url.replaceAll("/", "\\/")}"`));
assert.ok(existsSync(`public${url}`), "HTML materi publik harus ada");
const html = readFileSync(`public${url}`, "utf8");
assert.match(html, /Fungsi Biaya, Penerimaan, dan Laba/);
assert.match(html, /\/?course=KP21517007/, "HTML harus punya tautan kembali ke matkul");
console.log("material integration regression: OK");
