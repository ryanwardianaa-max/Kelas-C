import { useState } from "react";
import { ExternalLink, Sparkles } from "./Icons";
import InteractiveMath from "./InteractiveMath";

interface ToolItem {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  badgeColor: string;
  description: string;
  tags: string[];
  url: string;
}

const TOOLS_DATA: ToolItem[] = [
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

export default function ToolsView() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"katalog" | "simulasi">("katalog");

  const filteredTools =
    activeFilter === "all"
      ? TOOLS_DATA
      : TOOLS_DATA.filter((t) => t.courseCode === activeFilter);

  return (
    <>
      <div className="page-title action-title">
        <div>
          <small>LABORATORIUM & KOMPUTASI AKADEMIK</small>
          <h1>Alat Bantu & Kalkulator Matematika</h1>
          <p>
            Pusat alat bantu hitung umum, kalkulator edukatif step-by-step, dan laboratorium komputasi untuk seluruh mata kuliah Pendidikan Matematika.
          </p>
        </div>
      </div>

      <div className="chips" style={{ marginBottom: "16px" }}>
        <button
          className={activeTab === "katalog" ? "active" : ""}
          onClick={() => setActiveTab("katalog")}
        >
          <Sparkles /> Katalog Aplikasi Bantuan ({TOOLS_DATA.length})
        </button>
        <button
          className={activeTab === "simulasi" ? "active" : ""}
          onClick={() => setActiveTab("simulasi")}
        >
          Simulasi Visual Langsung
        </button>
      </div>

      {activeTab === "simulasi" ? (
        <InteractiveMath />
      ) : (
        <>
          <div className="chips" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "22px" }}>
            <button
              className={activeFilter === "all" ? "active" : ""}
              onClick={() => setActiveFilter("all")}
            >
              Semua ({TOOLS_DATA.length})
            </button>
            <button
              className={activeFilter === "UMUM" ? "active" : ""}
              onClick={() => setActiveFilter("UMUM")}
            >
              📐 Matematika Umum & Kalkulus
            </button>
            <button
              className={activeFilter === "KP21517003" ? "active" : ""}
              onClick={() => setActiveFilter("KP21517003")}
            >
              🔮 Analisis Kompleks
            </button>
            <button
              className={activeFilter === "KP21517001" ? "active" : ""}
              onClick={() => setActiveFilter("KP21517001")}
            >
              ⚙️ Metode Numerik
            </button>
            <button
              className={activeFilter === "KP21517007" ? "active" : ""}
              onClick={() => setActiveFilter("KP21517007")}
            >
              📈 Matematika Ekonomi
            </button>
            <button
              className={activeFilter === "KP21517004" ? "active" : ""}
              onClick={() => setActiveFilter("KP21517004")}
            >
              🔍 Analisis Real
            </button>
          </div>

          <div className="card-grid">
            {filteredTools.map((tool) => (
              <article
                className="panel card"
                key={tool.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: "14px",
                  borderTop: `4px solid ${tool.badgeColor}`,
                  boxShadow: "0 3px 12px rgba(0,0,0,0.03)",
                }}
              >
                <div>
                  <small style={{ color: tool.badgeColor, fontWeight: 700, textTransform: "uppercase" }}>
                    {tool.courseCode} · {tool.courseName}
                  </small>
                  <h3 style={{ marginTop: "6px", marginBottom: "8px", fontSize: "1.05rem" }}>{tool.title}</h3>
                  <p style={{ color: "#475569", fontSize: "0.88rem", lineHeight: "1.5" }}>{tool.description}</p>
                  
                  <div className="tags" style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "12px 0" }}>
                    {tool.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: "#f1f5f9",
                          color: "#334155",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "14px" }}>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: tool.badgeColor,
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      textDecoration: "none",
                      boxShadow: `0 3px 8px ${tool.badgeColor}40`,
                    }}
                  >
                    <ExternalLink /> Buka Alat Bantu
                  </a>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
