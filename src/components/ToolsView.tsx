import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "./Icons";
import InteractiveMath from "./InteractiveMath";
import { COURSE_TOOLS } from "../lib/courseTools";

const FILTERS = [
  ["all", "Semua"],
  ["UMUM", "Matematika Umum & Kalkulus"],
  ["KP21517003", "Analisis Kompleks"],
  ["KP21517001", "Metode Numerik"],
  ["KP21517007", "Matematika Ekonomi"],
  ["KP21517004", "Analisis Real"],
] as const;

export default function ToolsView() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"katalog" | "simulasi">("katalog");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const filteredTools = activeFilter === "all" ? COURSE_TOOLS : COURSE_TOOLS.filter((tool) => tool.courseCode === activeFilter);
  const activeLabel = FILTERS.find(([value]) => value === activeFilter)?.[1] ?? "Semua";

  useEffect(() => {
    if (!filterOpen) return;
    const close = (event: MouseEvent) => { if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setFilterOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [filterOpen]);

  return <>
    <div className="page-title action-title"><div><small>LABORATORIUM & KOMPUTASI AKADEMIK</small><h1>Alat Bantu & Kalkulator Matematika</h1></div></div>
    <div className="chips" style={{ marginBottom: "16px" }}>
      <button type="button" className={activeTab === "katalog" ? "active" : ""} onClick={() => setActiveTab("katalog")}>Katalog Aplikasi Bantuan ({COURSE_TOOLS.length})</button>
      <button type="button" className={activeTab === "simulasi" ? "active" : ""} onClick={() => setActiveTab("simulasi")}>Simulasi Visual Langsung</button>
    </div>
    {activeTab === "simulasi" ? <InteractiveMath /> : <>
      <div className="tool-filter" ref={filterRef}>
        <button type="button" className="tool-filter-trigger" aria-haspopup="listbox" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}>
          {activeLabel} ({filteredTools.length})
          <span aria-hidden="true">⌄</span>
        </button>
        {filterOpen && <div className="tool-filter-pop" role="listbox" aria-label="Pilih mata kuliah">{FILTERS.map(([value, label]) => <button type="button" role="option" aria-selected={activeFilter === value} className={activeFilter === value ? "active" : ""} key={value} onClick={() => { setActiveFilter(value); setFilterOpen(false); }}>{label}{value === "all" ? ` (${COURSE_TOOLS.length})` : ""}</button>)}</div>}
      </div>
      <div className="card-grid">{filteredTools.map((tool) => <article className="panel card" key={tool.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: "14px", borderTop: `4px solid ${tool.badgeColor}`, boxShadow: "0 3px 12px rgba(0,0,0,0.03)" }}><div><small style={{ color: tool.badgeColor, fontWeight: 700, textTransform: "uppercase" }}>{tool.courseCode} · {tool.courseName}</small><h3 style={{ marginTop: "6px", marginBottom: "8px", fontSize: "1.05rem" }}>{tool.title}</h3><div className="tags" style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "12px 0" }}>{tool.tags.map((tag) => <span key={tag} style={{ background: "#f1f5f9", color: "#334155", padding: "3px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>#{tag}</span>)}</div></div><div style={{ marginTop: "14px" }}><a href={tool.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: tool.badgeColor, color: "white", padding: "8px 16px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none", boxShadow: `0 3px 8px ${tool.badgeColor}40` }}><ExternalLink /> Buka Alat Bantu</a></div></article>)}</div>
    </>}
  </>;
}
