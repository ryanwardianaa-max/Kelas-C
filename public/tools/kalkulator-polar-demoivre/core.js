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
