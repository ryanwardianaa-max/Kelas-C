// Ubah foto catatan/papan tulis di public/materi ke WebP tanpa mengubah ukuran
// piksel, lalu perbarui rujukan di HTML. Tujuannya menghemat kuota data, bukan
// mengecilkan gambar — tulisan tangan harus tetap terbaca.
//
// Pakai: node scripts/compress-materi.mjs [--quality 90] [--dry]
//
// Kualitas bawaan 90 dipilih sengaja tinggi: sumbernya foto tulisan tangan,
// jadi ketajaman goresan lebih penting daripada menghemat beberapa ratus KB.
//
// Berkas asli tetap ada di arsip mata kuliah (Documents/.../01_Materi dan
// Pertemuan) dan di riwayat Git, jadi versi lama selalu bisa diambil kembali.
//
// ponytail: satu format keluaran (WebP), tanpa <picture> fallback. WebP didukung
// semua browser sejak 2020. Tambahkan fallback kalau nanti perlu browser lama.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const ROOT = "public/materi";
const SOURCE_EXT = new Set([".jpg", ".jpeg", ".png"]);
const args = process.argv.slice(2);
const quality = Number(args[args.indexOf("--quality") + 1]) || 90;
const dry = args.includes("--dry");

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
  );

const files = walk(ROOT);
const images = files.filter((f) => SOURCE_EXT.has(extname(f).toLowerCase()));
if (!images.length) {
  console.log("tidak ada gambar sumber; mungkin sudah dikonversi.");
  process.exit(0);
}

// Python + Pillow dipakai karena sudah terpasang di mesin ini dan tidak
// menambah dependensi npm untuk pekerjaan sekali jalan.
const encode = (src, dest) =>
  execFileSync("python", [
    "-c",
    [
      "import sys",
      "from PIL import Image",
      "src, dest, q = sys.argv[1], sys.argv[2], int(sys.argv[3])",
      "im = Image.open(src)",
      "im = im.convert('RGB') if im.mode in ('P', 'RGBA', 'LA') else im",
      "im.save(dest, 'WEBP', quality=q, method=6)",
    ].join("\n"),
    src,
    dest,
    String(quality),
  ]);

const rename = new Map();
let before = 0;
let after = 0;

for (const src of images) {
  const dest = src.replace(/\.(jpe?g|png)$/i, ".webp");
  const srcSize = statSync(src).size;
  if (dry) {
    console.log(`(dry) ${src} -> ${dest}`);
    before += srcSize;
    continue;
  }
  encode(src, dest);
  const destSize = statSync(dest).size;
  if (destSize >= srcSize) {
    // WebP tidak selalu menang; jangan tukar kalau hasilnya lebih besar.
    unlinkSync(dest);
    console.log(`lewati ${src} (webp lebih besar)`);
    before += srcSize;
    after += srcSize;
    continue;
  }
  rename.set(src.split(/[\\/]/).pop(), dest.split(/[\\/]/).pop());
  unlinkSync(src);
  before += srcSize;
  after += destSize;
  const pct = Math.round((1 - destSize / srcSize) * 100);
  console.log(`${String(Math.round(srcSize / 1024)).padStart(5)} KB -> ${String(Math.round(destSize / 1024)).padStart(4)} KB (-${pct}%)  ${dest}`);
}

if (dry) process.exit(0);

// Perbarui rujukan. Nama berkas diganti apa adanya supaya query cache-buster
// seperti ?v=20260827 tetap utuh.
let touched = 0;
for (const html of files.filter((f) => f.toLowerCase().endsWith(".html"))) {
  const original = readFileSync(html, "utf8");
  let next = original;
  for (const [from, to] of rename) next = next.split(from).join(to);
  if (next !== original) {
    writeFileSync(html, next, "utf8");
    touched += 1;
  }
}

console.log(
  `\n${rename.size} gambar dikonversi, ${touched} HTML diperbarui. ` +
    `${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB ` +
    `(hemat ${Math.round((before - after) / 1024)} KB, ${Math.round((1 - after / before) * 100)}%).`
);
