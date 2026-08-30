export interface ToolItem {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  badgeColor: string;
  description: string;
  tags: string[];
  url: string;
}

export const COURSE_TOOLS: ToolItem[] = [
  {
    id: "tool-kalkulator-ilmiah",
    title: "Kalkulator Ilmiah & Pecahan Edukatif",
    courseCode: "UMUM",
    courseName: "Matematika Umum",
    badgeColor: "#0284c7",
    description:
      "Kalkulator standar & ilmiah lengkap dengan konversi otomatis pecahan eksak (a/b) ke desimal, fungsi trigonometri (sin, cos, tan), logaritma, akar, pangkat, dan riwayat perhitungan interaktif.",
    tags: ["Aritmatika", "Pecahan Eksak", "Fungsi Ilmiah", "Riwayat Hitungan"],
    url: "/tools/kalkulator-ilmiah/index.html",
  },
  {
    id: "tool-kalkulator-kalkulus",
    title: "Kalkulator Kalkulus & Integral Umum (Step-by-Step)",
    courseCode: "UMUM",
    courseName: "Kalkulus & Analisis",
    badgeColor: "#0284c7",
    description:
      "Penjabaran langkah formal untuk Integral Tentu, Integral Tak Tentu (+C), Turunan Fungsi, dan Limit L'Hopital. Dilengkapi metode substitusi, parsial, serta visualisasi luas daerah kurva.",
    tags: ["Integral Tentu & Tak Tentu", "Turunan", "Limit", "Grafik Luas"],
    url: "/tools/kalkulator-kalkulus/index.html",
  },
  {
    id: "tool-kalkulator-matriks",
    title: "Kalkulator Aljabar Linear & Matriks (SPL)",
    courseCode: "UMUM",
    courseName: "Aljabar Linear",
    badgeColor: "#0284c7",
    description:
      "Operasi matriks 2x2, 3x3, 4x4 (Penjumlahan, Perkalian, Transpose), Determinan metode Sarrus & Kofaktor, Invers Matriks eksak, dan penyelesaian Sistem Persamaan Linear (Gauss & Cramer).",
    tags: ["Determinan", "Invers Matriks", "SPL", "Eliminasi Gauss"],
    url: "/tools/kalkulator-matriks/index.html",
  },
  {
    id: "tool-kalkulator-aljabar-kompleks",
    title: "Kalkulator Aljabar Bilangan Kompleks (Step-by-Step)",
    courseCode: "KP21517003",
    courseName: "Analisis Kompleks",
    badgeColor: "#6558df",
    description:
      "Kalkulator edukatif dengan penjabaran aljabar lengkap (penjumlahan, pengurangan, perkalian distributif i² = -1, pembagian sekawan penyebut, modulus, konjugat, polar & eksponensial Euler) dan visualisasi bidang Argand 2D.",
    tags: ["Aljabar Formal", "Bentuk Eksak & Desimal", "Bidang Argand 2D"],
    url: "/tools/kalkulator-kompleks/index.html",
  },
  {
    id: "tool-kalkulator-integral-kompleks",
    title: "Kalkulator Integral Kontur & Teorema Residu Kompleks",
    courseCode: "KP21517003",
    courseName: "Analisis Kompleks",
    badgeColor: "#6558df",
    description:
      "Alat bantu perhitungan integral lintasan ∮ f(z) dz pada bidang kompleks. Menentukan letak titik singular (di dalam / di luar kurva C), Teorema Cauchy-Goursat, Rumus Integral Cauchy, dan Teorema Residu Cauchy.",
    tags: ["Integral Kontur", "Teorema Residu", "Titik Singular", "Argand 2D"],
    url: "/tools/kalkulator-integral-kompleks/index.html",
  },
  {
    id: "tool-kalkulator-metnum",
    title: "Kalkulator Metode Numerik (Akar & Integrasi)",
    courseCode: "KP21517001",
    courseName: "Metode Numerik",
    badgeColor: "#059669",
    description:
      "Pencarian akar non-linear (Biseksi, Regula Falsi, Newton-Raphson, Secant) dengan tabel iterasi komplit dan galat toleransi. Integrasi numerik Kaidah Trapesium, Simpson 1/3, dan Simpson 3/8.",
    tags: ["Newton-Raphson", "Biseksi", "Simpson 1/3", "Tabel Iterasi"],
    url: "/tools/kalkulator-metnum/index.html",
  },
  {
    id: "tool-kalkulator-mateko",
    title: "Kalkulator Matematika Ekonomi (Pasar, Pajak & BEP)",
    courseCode: "KP21517007",
    courseName: "Matematika Ekonomi",
    badgeColor: "#ea580c",
    description:
      "Keseimbangan pasar Qd = Qs, analisis pergeseran kurva akibat Pajak spesifik (t) dan Subsidi (s), fungsi biaya TC, penerimaan TR, analisis laba/rugi dan titik impas (Break Even Point) dengan grafik 2D.",
    tags: ["Keseimbangan Pasar", "Pajak & Subsidi", "BEP", "Kurva Ekonomi"],
    url: "/tools/kalkulator-mateko/index.html",
  },
  {
    id: "tool-kalkulator-real",
    title: "Laboratorium & Pembukti Analisis Real (ε - δ)",
    courseCode: "KP21517004",
    courseName: "Analisis Real",
    badgeColor: "#db2777",
    description:
      "Eksplorasi interaktif definisi formal limit Epsilon-Delta (ε-δ) dengan grafik pita dinamis. Pengujian konvergensi barisan dan deret tak hingga (Uji Rasio, Uji Akar, Deret Geometri, p-series).",
    tags: ["Epsilon-Delta", "Uji Konvergensi", "Barisan & Deret"],
    url: "/tools/kalkulator-real/index.html",
  },
];

