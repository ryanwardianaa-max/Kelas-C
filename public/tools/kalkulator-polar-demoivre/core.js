// Inti perhitungan Pertemuan 04 Analisis Kompleks: modulus, argumen, bentuk
// polar, De Moivre, dan akar pangkat n. Dipisah dari tampilan supaya bisa diuji
// otomatis oleh tests/polar-demoivre.test.mjs.
//
// Semua sudut di dalam berkas ini disimpan dalam RADIAN; konversi ke derajat
// hanya dilakukan saat menampilkan.

export const TAU = Math.PI * 2;

export const modulus = (a, b) => Math.hypot(a, b);

// Argumen utama: hasil selalu di selang (-pi, pi]. Math.atan2 sudah sadar
// kuadran, jadi tidak perlu koreksi manual seperti di kalkulator sekolah.
export function argPrincipal(a, b) {
  if (a === 0 && b === 0) return NaN; // z = 0 tidak punya arah
  const t = Math.atan2(b, a);
  return t === -Math.PI ? Math.PI : t;
}

export const toDeg = (rad) => (rad * 180) / Math.PI;
export const toRad = (deg) => (deg * Math.PI) / 180;

export const toPolar = (a, b) => ({ r: modulus(a, b), theta: argPrincipal(a, b) });
export const toRect = (r, theta) => ({ a: r * Math.cos(theta), b: r * Math.sin(theta) });

export const mulPolar = (z1, z2) => ({ r: z1.r * z2.r, theta: z1.theta + z2.theta });

export function divPolar(z1, z2) {
  if (z2.r === 0) throw new Error("Pembagi tidak boleh nol.");
  return { r: z1.r / z2.r, theta: z1.theta - z2.theta };
}

// De Moivre: z^n = r^n (cos n.theta + i sin n.theta), berlaku untuk n bulat
// (termasuk negatif, asal z != 0).
export function power(z, n) {
  if (!Number.isInteger(n)) throw new Error("Pangkat harus bilangan bulat.");
  if (z.r === 0 && n <= 0) throw new Error("0 tidak bisa dipangkatkan nol atau negatif.");
  return { r: Math.pow(z.r, n), theta: z.theta * n };
}

// Akar pangkat n: selalu tepat n jawaban, berselisih sudut 2pi/n.
export function roots(z, n) {
  if (!Number.isInteger(n) || n < 1) throw new Error("Indeks akar harus bilangan bulat >= 1.");
  const rr = Math.pow(z.r, 1 / n);
  return Array.from({ length: n }, (_, k) => ({
    r: rr,
    theta: (z.theta + TAU * k) / n,
    k,
  }));
}

// Membawa sudut apa pun kembali ke selang (-pi, pi] agar tampilan tidak
// menunjukkan 450 derajat padahal maksudnya 90 derajat.
export function normalizeAngle(theta) {
  let t = theta % TAU;
  if (t <= -Math.PI) t += TAU;
  if (t > Math.PI) t -= TAU;
  return t;
}

export function quadrant(a, b) {
  if (a === 0 && b === 0) return "titik asal";
  if (a > 0 && b === 0) return "sumbu real positif";
  if (a < 0 && b === 0) return "sumbu real negatif";
  if (a === 0 && b > 0) return "sumbu imajiner positif";
  if (a === 0 && b < 0) return "sumbu imajiner negatif";
  if (a > 0 && b > 0) return "kuadran I";
  if (a < 0 && b > 0) return "kuadran II";
  if (a < 0 && b < 0) return "kuadran III";
  return "kuadran IV";
}

// Mencari bentuk eksak k.pi/m untuk sudut yang umum (30, 45, 60, 90, ...).
// ponytail: hanya mengenali penyebut kecil 1..12; sudut lain ditampilkan desimal.
export function prettyAngle(theta) {
  const deg = toDeg(theta);
  const rounded = Math.round(deg * 1e6) / 1e6;
  for (let den = 1; den <= 12; den += 1) {
    const num = (rounded * den) / 180;
    if (Math.abs(num - Math.round(num)) < 1e-9) {
      const n = Math.round(num);
      if (n === 0) return { deg: rounded, tex: "0" };
      const sign = n < 0 ? "-" : "";
      const an = Math.abs(n);
      if (den === 1) return { deg: rounded, tex: `${sign}${an === 1 ? "" : an}\\pi` };
      return { deg: rounded, tex: `${sign}\\frac{${an === 1 ? "" : an}\\pi}{${den}}` };
    }
  }
  return { deg: rounded, tex: `${rounded.toFixed(4)}^\\circ` };
}

// Membulatkan sisa hitungan mendekati nol supaya tidak muncul 1.2e-16.
export const clean = (x, eps = 1e-10) => (Math.abs(x) < eps ? 0 : x);

// Parser angka ramah mahasiswa: menerima desimal titik (3.14), desimal koma
// Indonesia (3,14), bentuk akar (2√3, sqrt(3)), pecahan (1/2), dan perkalian.
export function parseNum(raw) {
  if (raw == null) return NaN;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : NaN;
  let s = String(raw).trim();
  if (!s) return NaN;
  // Ganti koma desimal Indonesia menjadi titik
  s = s.replace(/,/g, ".");
  // Dukung simbol akar kuadrat: 2√3 -> 2*sqrt(3), √3 -> sqrt(3)
  s = s.replace(/√\s*([0-9.]+)/g, "sqrt($1)");
  s = s.replace(/(\d)\s*(sqrt|\()/gi, "$1*$2");
  s = s.replace(/sqrt\s*\(\s*([0-9.]+)\s*\)/gi, "Math.sqrt($1)");
  s = s.replace(/pi/gi, "Math.PI");
  s = s.replace(/×/g, "*").replace(/÷/g, "/").replace(/:/g, "/");
  // Keamanan: hanya izinkan digit, operator dasar, tanda kurung, titik, dan Math.(sqrt|PI)
  if (/[^0-9+\-*/().\s]/i.test(s.replace(/Math\.(sqrt|PI)/g, ""))) {
    const d = Number.parseFloat(s);
    return Number.isFinite(d) ? d : NaN;
  }
  try {
    const val = Function(`"use strict"; return (${s});`)();
    return typeof val === "number" && Number.isFinite(val) ? val : NaN;
  } catch {
    const d = Number.parseFloat(s);
    return Number.isFinite(d) ? d : NaN;
  }
}

// Penyederhanaan akar kuadrat eksak: sqrt(50) -> 5√2, sqrt(8) -> 2√2
export function simplifyRadical(n) {
  if (!Number.isInteger(n) || n < 0) return null;
  if (n === 0) return { outside: 0, inside: 0, tex: "0" };
  let outside = 1;
  let inside = n;
  for (let i = Math.floor(Math.sqrt(n)); i >= 2; i--) {
    if (inside % (i * i) === 0) {
      outside *= i;
      inside = Math.round(inside / (i * i));
      break;
    }
  }
  let tex;
  if (inside === 1) tex = String(outside);
  else if (outside === 1) tex = `\\sqrt{${inside}}`;
  else tex = `${outside}\\sqrt{${inside}}`;
  return { outside, inside, tex };
}

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// Konversi sudut derajat bulat ke bentuk pecahan pi eksak
export function degToPiFrac(deg) {
  deg = Math.round(deg * 1e4) / 1e4;
  if (deg === 0) return "0";
  for (let den = 1; den <= 36; den++) {
    const num = (deg * den) / 180;
    if (Math.abs(num - Math.round(num)) < 1e-5) {
      let n = Math.round(num);
      let d = den;
      const g = gcd(n, d);
      n /= g;
      d /= g;
      const sign = n < 0 ? "-" : "";
      const an = Math.abs(n);
      if (d === 1) return an === 1 ? `${sign}\\pi` : `${sign}${an}\\pi`;
      return `${sign}\\frac{${an === 1 ? "" : an}\\pi}{${d}}`;
    }
  }
  return null;
}

// Perkalian titik (dot product) bilangan kompleks
export const dotProduct = (a1, b1, a2, b2) => a1 * a2 + b1 * b2;

// Perkalian silang (cross product) bilangan kompleks (determinan 2x2)
export const crossProduct = (a1, b1, a2, b2) => a1 * b2 - b1 * a2;

// Jarak euclides antara dua titik bilangan kompleks
export function complexDistance(a1, b1, a2, b2) {
  const da = a1 - a2;
  const db = b1 - b2;
  const distSq = clean(da * da + db * db);
  const rad = Number.isInteger(distSq) ? simplifyRadical(distSq) : null;
  return {
    da,
    db,
    distSq,
    radTex: rad ? rad.tex : null,
    dist: Math.sqrt(distSq),
  };
}


