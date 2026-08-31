import assert from "node:assert/strict";
import fs from "node:fs";

const dashboard = fs.readFileSync(new URL("../src/components/DashboardView.tsx", import.meta.url), "utf8");
const mobileNav = fs.readFileSync(new URL("../src/components/MobileNav.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/App.css", import.meta.url), "utf8");

assert.doesNotMatch(dashboard, /z = x \+ iy|className="formula"/, "rumus dekoratif harus dihapus");
assert.doesNotMatch(dashboard, /Ringkasan akademikmu mengikuti/, "penjelasan WIB panjang harus dihapus");
assert.doesNotMatch(dashboard, /className="stats"/, "statistik tidak boleh berupa kartu besar");
assert.match(dashboard, /dashboard-meta/, "statistik ringkas harus tetap tersedia sebagai metadata");
assert.match(dashboard, /slice\(0,\s*3\)/, "deadline beranda maksimal tiga");

assert.match(mobileNav, /mobile-limelight/, "navigasi mobile harus memiliki limelight aktif");
assert.match(mobileNav, /aria-current=\{page === p \? "page" : undefined\}/, "halaman aktif harus diumumkan");
assert.match(css, /prefers-reduced-motion: reduce/, "animasi harus menghormati reduced motion");

console.log("UI simplification guard: OK");
