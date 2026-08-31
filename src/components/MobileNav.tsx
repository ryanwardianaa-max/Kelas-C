import { BookOpen, CheckSquare, Home, Library } from "./Icons";
import type { Page } from "../types";

const items = [
  ["Beranda", Home],
  ["Mata Kuliah", BookOpen],
  ["Tugas", CheckSquare],
  ["Materi", BookOpen],
  ["Referensi", Library],
] as const;

export default function MobileNav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const activeIndex = items.findIndex(([name]) => name === page);

  return (
    <nav className="mobile-nav" aria-label="Navigasi utama">
      {items.map(([p, Icon], index) => (
        <button
          className={page === p ? "active" : ""}
          onClick={() => setPage(p)}
          key={p}
          aria-label={p}
          aria-current={page === p ? "page" : undefined}
        >
          <Icon />
          <span>{p}</span>
          {index === activeIndex && <i className="mobile-limelight" aria-hidden="true" />}
        </button>
      ))}
    </nav>
  );
}
