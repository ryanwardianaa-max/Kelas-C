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
  url?: string;
  isExternal?: boolean;
}

const TOOLS_DATA: ToolItem[] = [
  {
    id: "tool-kalkulator-aljabar-kompleks",
    title: "Kalkulator Aljabar Bilangan Kompleks (Step-by-Step)",
    courseCode: "KP21517003",
    courseName: "Analisis Kompleks",
    badgeColor: "#6558df",
    description:
      "Kalkulator edukatif dengan penjabaran aljabar lengkap (penjumlahan, pengurangan, perkalian distributif i² = -1, pembagian dengan sekawan penyebut, konjugat, modulus, polar & eksponensial Euler) dan visualisasi bidang Argand 2D.",
    tags: ["Aljabar Formal", "Bentuk Eksak & Desimal", "Bidang Argand 2D"],
    url: "/tools/kalkulator-kompleks/index.html",
    isExternal: true,
  },
  {
    id: "tool-kalkulator-integral-kompleks",
    title: "Kalkulator Integral Kontur & Teorema Residu Kompleks",
    courseCode: "KP21517003",
    courseName: "Analisis Kompleks",
    badgeColor: "#6558df",
    description:
      "Alat bantu perhitungan integral lintasan ∮ f(z) dz pada bidang kompleks. Menentukan letak titik singular (di dalam / di luar kurva C), Teorema Cauchy-Goursat, Rumus Integral Cauchy, dan Teorema Residu.",
    tags: ["Integral Kontur", "Teorema Residu", "Titik Singular"],
    url: "/tools/kalkulator-integral-kompleks/index.html",
    isExternal: true,
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
          <h1>Alat Bantu & Kalkulator</h1>
          <p>
            Pusat alat bantu hitung, kalkulator edukatif step-by-step, dan simulasi interaktif untuk mata kuliah Semester 7.
          </p>
        </div>
      </div>

      <div className="chips">
        <button
          className={activeTab === "katalog" ? "active" : ""}
          onClick={() => setActiveTab("katalog")}
        >
          <Sparkles /> Katalog Aplikasi Bantuan
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
          <div className="chips" style={{ marginTop: "4px", marginBottom: "20px" }}>
            <button
              className={activeFilter === "all" ? "active" : ""}
              onClick={() => setActiveFilter("all")}
            >
              Semua Mata Kuliah
            </button>
            <button
              className={activeFilter === "KP21517003" ? "active" : ""}
              onClick={() => setActiveFilter("KP21517003")}
            >
              Analisis Kompleks
            </button>
            <button
              className={activeFilter === "KP21517001" ? "active" : ""}
              onClick={() => setActiveFilter("KP21517001")}
            >
              Metode Numerik
            </button>
            <button
              className={activeFilter === "KP21517004" ? "active" : ""}
              onClick={() => setActiveFilter("KP21517004")}
            >
              Analisis Real
            </button>
            <button
              className={activeFilter === "KP21517007" ? "active" : ""}
              onClick={() => setActiveFilter("KP21517007")}
            >
              Matematika Ekonomi
            </button>
          </div>

          <div className="card-grid">
            {filteredTools.map((tool) => (
              <article className="panel card" key={tool.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <small style={{ color: tool.badgeColor, fontWeight: 700 }}>
                    {tool.courseCode} · {tool.courseName}
                  </small>
                  <h3 style={{ marginTop: "6px", marginBottom: "8px" }}>{tool.title}</h3>
                  <p style={{ color: "#475569", fontSize: "0.9rem" }}>{tool.description}</p>
                  
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

                {tool.url && (
                  <div style={{ marginTop: "14px" }}>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className="primary"
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
                      }}
                    >
                      <ExternalLink /> Buka Aplikasi Bantuan
                    </a>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
