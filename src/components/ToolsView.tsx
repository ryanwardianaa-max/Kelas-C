import { useState } from "react";
import { ExternalLink, Sparkles } from "./Icons";
import InteractiveMath from "./InteractiveMath";

import { COURSE_TOOLS } from "../lib/courseTools";

export default function ToolsView() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"katalog" | "simulasi">("katalog");

  const filteredTools =
    activeFilter === "all"
      ? COURSE_TOOLS
      : COURSE_TOOLS.filter((t) => t.courseCode === activeFilter);

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
        <button type="button"
          className={activeTab === "katalog" ? "active" : ""}
          onClick={() => setActiveTab("katalog")}
        >
          <Sparkles /> Katalog Aplikasi Bantuan ({COURSE_TOOLS.length})
        </button>
        <button type="button"
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
            <button type="button"
              className={activeFilter === "all" ? "active" : ""}
              onClick={() => setActiveFilter("all")}
            >
              Semua ({COURSE_TOOLS.length})
            </button>
            <button type="button"
              className={activeFilter === "UMUM" ? "active" : ""}
              onClick={() => setActiveFilter("UMUM")}
            >
              📐 Matematika Umum & Kalkulus
            </button>
            <button type="button"
              className={activeFilter === "KP21517003" ? "active" : ""}
              onClick={() => setActiveFilter("KP21517003")}
            >
              🔮 Analisis Kompleks
            </button>
            <button type="button"
              className={activeFilter === "KP21517001" ? "active" : ""}
              onClick={() => setActiveFilter("KP21517001")}
            >
              ⚙️ Metode Numerik
            </button>
            <button type="button"
              className={activeFilter === "KP21517007" ? "active" : ""}
              onClick={() => setActiveFilter("KP21517007")}
            >
              📈 Matematika Ekonomi
            </button>
            <button type="button"
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
