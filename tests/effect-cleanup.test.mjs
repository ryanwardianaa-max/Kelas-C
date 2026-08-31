// Penjaga: useEffect berbadan ekspresi (arrow tanpa kurung kurawal) menyerahkan
// nilai balik ekspresi itu ke React sebagai fungsi cleanup. Kalau ekspresinya
// membalas non-fungsi (mis. scrollIntoView({behavior:'smooth'}) yang kini
// membalas Promise di Chrome baru), React memanggilnya saat unmount dan seluruh
// UI jatuh ke ErrorBoundary: "TypeError: l is not a function".
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const offenders = [];
for (const path of walk("src").filter((p) => /\.tsx?$/.test(p))) {
  const source = readFileSync(path, "utf8");
  // `\s*` bisa backtrack, jadi lookahead tidak dapat dipercaya di sini: ambil
  // karakter non-spasi pertama setelah `=>` lalu bandingkan langsung.
  for (const match of source.matchAll(/useEffect\(\s*\(\)\s*=>\s*(\S.{0,60})/g)) {
    if (match[1].startsWith("{")) continue;
    offenders.push(`${path}: useEffect(()=>${match[1].trim()}`);
  }
}

assert.deepEqual(
  offenders,
  [],
  `useEffect berbadan ekspresi mengembalikan nilai ke React sebagai cleanup:\n${offenders.join("\n")}`,
);

console.log("useEffect cleanup guard: OK");
