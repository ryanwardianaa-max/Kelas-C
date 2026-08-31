// Penjaga: aset yang hilang tidak boleh dibalas HTML, dan service worker tidak
// boleh menyimpan/menyajikan HTML sebagai JS. Kombinasi keduanya membuat React
// gagal mount dan ErrorBoundary muncul terus sampai cache dibersihkan.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const sw = readFileSync("public/sw.js", "utf8");

// 1. Rewrite SPA harus mengecualikan /assets/, supaya berkas hash yang sudah
//    tidak ada mengembalikan 404 asli, bukan index.html berstatus 200.
const [rewrite, ...extra] = vercel.rewrites;
assert.equal(extra.length, 0, "hanya satu rewrite yang diharapkan");
assert.equal(rewrite.destination, "/index.html");
const spa = new RegExp(`^${rewrite.source}$`);
assert.ok(spa.test("/tugas"), "rute aplikasi harus tetap diarahkan ke index.html");
assert.ok(spa.test("/"), "akar harus tetap diarahkan ke index.html");
assert.ok(!spa.test("/assets/index-ABC123.js"), "aset TIDAK boleh diarahkan ke index.html");
assert.ok(!spa.test("/assets/index-ABC123.css"), "aset CSS TIDAK boleh diarahkan ke index.html");

// 2. Service worker harus menolak HTML pada jalur non-navigasi, dua arah:
//    saat menyimpan dan saat menyajikan dari cache lama.
assert.match(sw, /const isHtml =/, "penjaga HTML harus ada");
assert.match(sw, /response\.ok && !isHtml\(response\)/, "HTML tidak boleh disimpan sebagai aset");
assert.match(sw, /cached && !isHtml\(cached\)/, "HTML beracun di cache lama tidak boleh disajikan");

// 3. Nama cache harus naik supaya cache beracun di perangkat lama terbuang.
const version = sw.match(/kelasku-pwa-v(\d+)/);
assert.ok(version, "nama cache harus berversi");
assert.ok(Number(version[1]) >= 5, "versi cache harus dinaikkan setelah perbaikan ini");

console.log(`asset/SW guard: OK (cache v${version[1]})`);
