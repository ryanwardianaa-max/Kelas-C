import type { ReferenceItem } from "../types";

export const INITIAL_METNUM_REFERENCES: ReferenceItem[] = [
  {
    id: "ref-metnum-buku-utama",
    title: "Buku Metode Numerik — Dr. Rinaldi Munir (STEI ITB)",
    courseCode: "KP21517001",
    category: "E-Book",
    urlOrPath:
      "https://informatika.stei.itb.ac.id/~rinaldi.munir/Buku/Metode%20Numerik/",
    description:
      "Buku teks utama perkuliahan Metode Numerik berbahasa Indonesia oleh Dr. Rinaldi Munir (Informatika STEI ITB). Memuat panduan komprehensif mulai dari dasar komputasi, analisis galat, pencarian akar, sistem persamaan lanjar, interpolasi, integrasi & turunan numerik, hingga persamaan diferensial biasa.",
    tags: [
      "Buku Utama",
      "STEI ITB",
      "Rinaldi Munir",
      "Metode Numerik",
      "Teori & Algoritma",
    ],
    createdAt: "2026-08-16T00:00:00.000Z",
  },
  {
    id: "ref-metnum-bab-01",
    title: "Bab 01 — Metode Numerik Secara Umum",
    courseCode: "KP21517001",
    meetingNo: 1,
    category: "E-Book",
    urlOrPath:
      "https://informatika.stei.itb.ac.id/~rinaldi.munir/Buku/Metode%20Numerik/BAb-%2001%20Metode%20Numerik%20Secara%20Umum.pdf",
    description:
      "Konsep Sederhana: Mengapa butuh metode numerik? Metode analitik (hitung tangan eksak) sering kali mentok saat menghadapi persamaan rumit di dunia nyata. Metode numerik adalah teknik mencari solusi 'hampiran' (taksiran yang sangat akurat) dengan memanfaatkan operasi hitung aritmetika yang dapat diulang ribuan kali oleh komputer.",
    tags: [
      "Bab 1",
      "Pengantar",
      "Analitik vs Numerik",
      "Hampiran",
      "Komputasi",
    ],
    createdAt: "2026-08-16T00:01:00.000Z",
  },
  {
    id: "ref-metnum-bab-02",
    title: "Bab 02 — Deret Taylor dan Analisis Galat (Error)",
    courseCode: "KP21517001",
    meetingNo: 2,
    category: "E-Book",
    urlOrPath:
      "https://informatika.stei.itb.ac.id/~rinaldi.munir/Buku/Metode%20Numerik/pdf/BAb-%2002%20Deret%20Taylor%20dan%20Analisis%20Galat.pdf",
    description:
      "Konsep Sederhana: Komputer punya batas memori dan angka desimal. Karena itu, timbul selisih antara nilai sebenarnya dengan nilai hitungan komputer (disebut Galat / Error). Bab ini mengajarkan Deret Taylor untuk 'memotong' rumus rumit dan cara mengendalikan galat pemotongan serta pembulatan agar hitungan tetap presisi.",
    tags: [
      "Bab 2",
      "Deret Taylor",
      "Galat",
      "Error Analysis",
      "Floating Point",
    ],
    createdAt: "2026-08-16T00:02:00.000Z",
  },
  {
    id: "ref-metnum-bab-03",
    title: "Bab 03 — Solusi Persamaan Nirlanjar (Pencarian Akar)",
    courseCode: "KP21517001",
    meetingNo: 3,
    category: "E-Book",
    urlOrPath:
      "https://informatika.stei.itb.ac.id/~rinaldi.munir/Buku/Metode%20Numerik/pdf/BAb-%2003%20Solusi%20Persamaan%20Nirlanjar.pdf",
    description:
      "Konsep Sederhana: Trik mencari nilai x yang membuat f(x) = 0 saat fungsinya tidak bisa difaktorkan manual. Mempelajari Metode Tertutup/Kurung (Biseksi yang membagi dua interval secara aman, Regula Falsi) dan Metode Terbuka yang lebih cepat (Newton-Raphson berbasis turunan & Secant).",
    tags: [
      "Bab 3",
      "Akar Persamaan",
      "Biseksi",
      "Regula Falsi",
      "Newton-Raphson",
      "Secant",
    ],
    createdAt: "2026-08-16T00:03:00.000Z",
  },
  {
    id: "ref-metnum-bab-04",
    title: "Bab 04 — Solusi Sistem Persamaan Lanjar (SPL)",
    courseCode: "KP21517001",
    meetingNo: 6,
    category: "E-Book",
    urlOrPath:
      "https://informatika.stei.itb.ac.id/~rinaldi.munir/Buku/Metode%20Numerik/pdf/BAb-%2004%20Solusi%20Sistem%20Persamaan%20Lanjar.pdf",
    description:
      "Konsep Sederhana: Cara menyelesaikan banyak persamaan dengan banyak variabel sekaligus (matriks Ax = b). Membahas metode langsung (Eliminasi Gauss, Gauss-Jordan, Matriks Balikan, Dekomposisi LU) dan metode iteratif yang hemat memori untuk matriks raksasa (Metode Jacobi & Gauss-Seidel).",
    tags: [
      "Bab 4",
      "SPL",
      "Eliminasi Gauss",
      "Gauss-Jordan",
      "Dekomposisi LU",
      "Iterasi Jacobi",
      "Gauss-Seidel",
    ],
    createdAt: "2026-08-16T00:04:00.000Z",
  },
  {
    id: "ref-metnum-bab-05",
    title: "Bab 05 — Interpolasi Polinom",
    courseCode: "KP21517001",
    meetingNo: 9,
    category: "E-Book",
    urlOrPath:
      "https://informatika.stei.itb.ac.id/~rinaldi.munir/Buku/Metode%20Numerik/pdf/BAb-%2005%20Interpolasi%20Polinom.pdf",
    description:
      "Konsep Sederhana: Menghubungkan titik-titik data eksperimen menjadi kurva grafik yang mulus. Jika kita punya beberapa titik data terpisah, interpolasi (Polinom Lagrange, Polinom Newton, Spline) memungkinkan kita menebak nilai fungsi pada titik manapun di antara data tersebut secara akurat.",
    tags: [
      "Bab 5",
      "Interpolasi",
      "Polinom Lagrange",
      "Polinom Newton",
      "Spline",
      "Pencocokan Kurva",
    ],
    createdAt: "2026-08-16T00:05:00.000Z",
  },
  {
    id: "ref-metnum-bab-07",
    title: "Bab 07 — Turunan Numerik (Diferensiasi Numerik)",
    courseCode: "KP21517001",
    meetingNo: 11,
    category: "E-Book",
    urlOrPath:
      "https://informatika.stei.itb.ac.id/~rinaldi.munir/Buku/Metode%20Numerik/pdf/BAb-%2007%20Turunan%20Numerik.pdf",
    description:
      "Konsep Sederhana: Menghitung gradien kemiringan grafik / kecepatan perubahan f'(x) ketika rumus analitik fungsinya tidak diketahui atau hanya tersedia tabel titik data. Menggunakan pendekatan beda hingga: Selisih Maju, Selisih Mundur, dan Selisih Pusat (orde ketelitian lebih tinggi).",
    tags: [
      "Bab 7",
      "Turunan Numerik",
      "Diferensiasi",
      "Selisih Maju",
      "Selisih Mundur",
      "Selisih Pusat",
    ],
    createdAt: "2026-08-16T00:06:00.000Z",
  },
  {
    id: "ref-metnum-bab-06",
    title: "Bab 06 — Integrasi Numerik",
    courseCode: "KP21517001",
    meetingNo: 12,
    category: "E-Book",
    urlOrPath:
      "https://informatika.stei.itb.ac.id/~rinaldi.munir/Buku/Metode%20Numerik/pdf/BAb-%2006%20Integrasi%20Numerik.pdf",
    description:
      "Konsep Sederhana: Menghitung luas daerah di bawah kurva (integral tentu) ketika fungsi integran sulit/mustahil diintegralkan secara analitik. Area dipecah menjadi pias bidang trapesium (Aturan Trapesium) atau potongan kurva parabola (Aturan Simpson 1/3 dan 3/8) lalu dijumlahkan.",
    tags: [
      "Bab 6",
      "Integrasi Numerik",
      "Aturan Trapesium",
      "Simpson 1/3",
      "Simpson 3/8",
      "Kuadratur Gauss",
    ],
    createdAt: "2026-08-16T00:07:00.000Z",
  },
  {
    id: "ref-metnum-bab-08",
    title: "Bab 08 — Solusi Persamaan Diferensial Biasa (PDB)",
    courseCode: "KP21517001",
    meetingNo: 14,
    category: "E-Book",
    urlOrPath:
      "https://informatika.stei.itb.ac.id/~rinaldi.munir/Buku/Metode%20Numerik/pdf/BAb-%2008%20Solusi%20Persamaan%20Diferensial%20Biasa.pdf",
    description:
      "Konsep Sederhana: Memprediksi grafik perkembangan sistem (seperti peluruhan, dinamika fluida, atau rangkaian listrik) dari kondisi nilai awal dy/dx = f(x,y). Menggunakan langkah beruntun step-by-step: Metode Euler (sederhana), Metode Heun (prediktor-korektor), dan Metode Runge-Kutta (standar industri dengan akurasi tinggi).",
    tags: [
      "Bab 8",
      "PDB",
      "Masalah Nilai Awal",
      "Metode Euler",
      "Metode Heun",
      "Runge-Kutta Orde 4",
    ],
    createdAt: "2026-08-16T00:08:00.000Z",
  },
];
