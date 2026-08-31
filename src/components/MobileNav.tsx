import { BookOpen, CheckSquare, Home, Sparkles } from "./Icons";
import type { Page } from "../types";
const items = [["Beranda", Home], ["Mata Kuliah", BookOpen], ["Alat Bantu", Sparkles], ["Tugas", CheckSquare]] as const;
export default function MobileNav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return <nav className="mobile-nav" aria-label="Navigasi utama">{items.map(([p, I]) => <button className={page === p ? "active" : ""} onClick={() => setPage(p)} key={p} aria-label={p} aria-current={page === p ? "page" : undefined}><I /><span>{p}</span></button>)}</nav>;
}
