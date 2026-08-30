// Uji inti perhitungan kalkulator Pertemuan 04 (polar, De Moivre, akar).
// Jalankan: node tests/polar-demoivre.test.mjs
import assert from "node:assert/strict";
import {
  modulus, argPrincipal, toDeg, toRad, toPolar, toRect,
  mulPolar, divPolar, power, roots, normalizeAngle, quadrant, prettyAngle, clean,
} from "../public/tools/kalkulator-polar-demoivre/core.js";

const near = (a, b, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `harap ${a} dekat dengan ${b}`);

// 1. Modulus — contoh 1 di materi
near(modulus(3, 4), 5);
near(modulus(-2, 2), Math.sqrt(8));
near(modulus(0, 0), 0);
near(modulus(-5, 12), 13);

// 2. Argumen sadar kuadran. Ini yang paling sering salah kalau pakai atan biasa.
near(toDeg(argPrincipal(1, 1)), 45);
near(toDeg(argPrincipal(-1, 1)), 135);    // kuadran II, contoh 2 di materi
near(toDeg(argPrincipal(-1, -1)), -135);  // kuadran III
near(toDeg(argPrincipal(1, -1)), -45);    // kuadran IV
near(toDeg(argPrincipal(-1, 0)), 180);    // batas: harus +180, bukan -180
near(toDeg(argPrincipal(0, 1)), 90);
assert.ok(Number.isNaN(argPrincipal(0, 0)), "z=0 tidak punya argumen");

// atan(1/-1) = -45 padahal jawaban benar 135. Pastikan tidak jatuh ke jebakan itu.
assert.notEqual(Math.round(toDeg(argPrincipal(-1, 1))), -45);

// 3. Argumen utama selalu di (-pi, pi]
for (const [a, b] of [[1, 1], [-1, 1], [-1, -1], [1, -1], [-1, 0], [0, -1], [3, -4]]) {
  const t = argPrincipal(a, b);
  assert.ok(t > -Math.PI - 1e-12 && t <= Math.PI + 1e-12, `Arg di luar selang: ${t}`);
}

// 4. Konversi bolak-balik: rect -> polar -> rect harus kembali utuh
for (const [a, b] of [[3, 4], [-2, 2 * Math.sqrt(3)], [-3, -3], [0.5, -7], [-5, 12]]) {
  const { r, theta } = toPolar(a, b);
  const back = toRect(r, theta);
  near(back.a, a, 1e-9);
  near(back.b, b, 1e-9);
}

// 5. Contoh 3 di materi: z = -2 + 2i*sqrt(3) -> r=4, theta=120 derajat
{
  const { r, theta } = toPolar(-2, 2 * Math.sqrt(3));
  near(r, 4);
  near(toDeg(theta), 120);
}

// 6. Perkalian: panjang dikali, sudut ditambah
{
  const z1 = { r: 2, theta: toRad(50) };
  const z2 = { r: 4, theta: toRad(20) };
  const p = mulPolar(z1, z2);
  near(p.r, 8);
  near(toDeg(p.theta), 70);

  const q = divPolar(z1, z2);
  near(q.r, 0.5);
  near(toDeg(q.theta), 30);
}

// Perkalian polar harus setara perkalian aljabar Pertemuan 03: (2+3i)(2-i) = 7+4i
{
  const p = mulPolar(toPolar(2, 3), toPolar(2, -1));
  const { a, b } = toRect(p.r, p.theta);
  near(a, 7, 1e-9);
  near(b, 4, 1e-9);
}

// Pembagian polar harus setara contoh Pertemuan 03: (2+3i)/(2-i) = 0.2 + 1.6i
{
  const q = divPolar(toPolar(2, 3), toPolar(2, -1));
  const { a, b } = toRect(q.r, q.theta);
  near(a, 0.2, 1e-9);
  near(b, 1.6, 1e-9);
}

assert.throws(() => divPolar({ r: 1, theta: 0 }, { r: 0, theta: 0 }), /nol/);

// 7. De Moivre — contoh 4 di materi: (1+i)^10 = 32i
{
  const p = power(toPolar(1, 1), 10);
  const { a, b } = toRect(p.r, p.theta);
  near(clean(a), 0, 1e-9);
  near(b, 32, 1e-9);
}

// (sqrt3 + i)^6 = -64 (latihan nomor 4)
{
  const p = power(toPolar(Math.sqrt(3), 1), 6);
  const { a, b } = toRect(p.r, p.theta);
  near(a, -64, 1e-8);
  near(clean(b, 1e-8), 0);
}

// Pangkat negatif: (1+i)^-1 = 0.5 - 0.5i
{
  const p = power(toPolar(1, 1), -1);
  const { a, b } = toRect(p.r, p.theta);
  near(a, 0.5);
  near(b, -0.5);
}

assert.throws(() => power({ r: 2, theta: 0 }, 1.5), /bulat/);
assert.throws(() => power({ r: 0, theta: 0 }, -2), /negatif/);

// 8. Akar: contoh 5 di materi, akar pangkat 3 dari 8
{
  const rs = roots(toPolar(8, 0), 3);
  assert.equal(rs.length, 3, "akar pangkat 3 harus ada 3 buah");
  const rect = rs.map((w) => toRect(w.r, w.theta));

  near(rect[0].a, 2); near(clean(rect[0].b), 0);
  near(rect[1].a, -1, 1e-9); near(rect[1].b, Math.sqrt(3), 1e-9);
  near(rect[2].a, -1, 1e-9); near(rect[2].b, -Math.sqrt(3), 1e-9);

  // setiap akar dipangkatkan 3 harus kembali ke 8
  for (const w of rs) {
    const back = toRect(...Object.values(power({ r: w.r, theta: w.theta }, 3)).slice(0, 2));
    const cubed = power({ r: w.r, theta: w.theta }, 3);
    const c = toRect(cubed.r, cubed.theta);
    near(c.a, 8, 1e-8);
    near(clean(c.b, 1e-8), 0);
    void back;
  }

  // semua akar sejarak sama dari titik asal, selisih sudut 120 derajat
  near(rs[0].r, 2); near(rs[1].r, 2); near(rs[2].r, 2);
  near(toDeg(rs[1].theta - rs[0].theta), 120);
  near(toDeg(rs[2].theta - rs[1].theta), 120);
}

// z^4 = 16 punya 4 akar; jumlah seluruh akar = 0 (latihan nomor 5)
{
  const rs = roots(toPolar(16, 0), 4);
  assert.equal(rs.length, 4);
  let sa = 0, sb = 0;
  for (const w of rs) { const { a, b } = toRect(w.r, w.theta); sa += a; sb += b; }
  near(clean(sa, 1e-9), 0);
  near(clean(sb, 1e-9), 0);
}

// akar satuan pangkat n: semuanya di lingkaran |z| = 1, jumlahnya nol
for (const n of [2, 3, 5, 8]) {
  const rs = roots({ r: 1, theta: 0 }, n);
  assert.equal(rs.length, n);
  let sa = 0, sb = 0;
  for (const w of rs) {
    near(w.r, 1);
    const { a, b } = toRect(w.r, w.theta);
    sa += a; sb += b;
  }
  near(clean(sa, 1e-9), 0, 1e-9);
  near(clean(sb, 1e-9), 0, 1e-9);
}

assert.throws(() => roots({ r: 8, theta: 0 }, 0), />= 1/);
assert.throws(() => roots({ r: 8, theta: 0 }, 2.5), /bulat/);

// 9. normalizeAngle: 450 derajat harus tampil 90 derajat
near(toDeg(normalizeAngle(toRad(450))), 90);
near(toDeg(normalizeAngle(toRad(-450))), -90);
near(toDeg(normalizeAngle(toRad(180))), 180);
near(toDeg(normalizeAngle(toRad(-180))), 180);
near(toDeg(normalizeAngle(toRad(720))), 0);

// 10. Kuadran
assert.equal(quadrant(1, 1), "kuadran I");
assert.equal(quadrant(-1, 1), "kuadran II");
assert.equal(quadrant(-1, -1), "kuadran III");
assert.equal(quadrant(1, -1), "kuadran IV");
assert.equal(quadrant(0, 0), "titik asal");
assert.equal(quadrant(2, 0), "sumbu real positif");
assert.equal(quadrant(0, -3), "sumbu imajiner negatif");

// 11. prettyAngle memberi bentuk eksak untuk sudut istimewa
assert.equal(prettyAngle(toRad(45)).tex, "\\frac{\\pi}{4}");
assert.equal(prettyAngle(toRad(90)).tex, "\\frac{\\pi}{2}");
assert.equal(prettyAngle(toRad(120)).tex, "\\frac{2\\pi}{3}");
assert.equal(prettyAngle(toRad(180)).tex, "\\pi");
assert.equal(prettyAngle(0).tex, "0");
assert.equal(prettyAngle(toRad(-135)).tex, "-\\frac{3\\pi}{4}");

console.log("polar/De Moivre behaviour: OK");
