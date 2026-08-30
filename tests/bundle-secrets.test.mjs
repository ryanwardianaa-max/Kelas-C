// Penjaga: tidak ada kunci API yang boleh ikut ke dalam bundel produksi.
// Berjalan atas hasil `npm run build` yang sebenarnya, bukan atas kode sumber.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = "dist/assets";
assert.ok(existsSync(dir), "jalankan `npm run build` dulu");

const files = readdirSync(dir).filter((f) => f.endsWith(".js"));
assert.ok(files.length, "tidak ada berkas JS di dist/assets");

// Pola kunci yang pernah/mungkin muncul di proyek ini.
const forbidden = [
  [/sk-[A-Za-z0-9_-]{12}/, "kunci OpenAI/GoRouter (sk-…)"],
  [/sk-or-[A-Za-z0-9_-]{8}/, "kunci OpenRouter"],
  [/sb_secret_[A-Za-z0-9_-]{8}/, "service key Supabase"],
  [/service_role/, "service_role Supabase"],
  [/GOROUTER_API_KEY/, "nama env kunci server"],
  [/gorouter\.app/, "base URL GoRouter (harus tinggal di server)"],
];

const hits = [];
for (const file of files) {
  const text = readFileSync(join(dir, file), "utf8");
  for (const [pattern, label] of forbidden) if (pattern.test(text)) hits.push(`${file}: ${label}`);
}

assert.deepEqual(hits, [], `Rahasia ikut ke bundel:\n${hits.join("\n")}`);

// Proxy harus dipanggil lewat jalur relatif, jadi kunci tetap di server.
const bundle = files.map((f) => readFileSync(join(dir, f), "utf8")).join("");
assert.ok(bundle.includes("/chat/completions"), "jalur proxy hilang dari bundel");

console.log(`bundle secret scan: OK (${files.length} berkas JS)`);
