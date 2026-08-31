import { Check, ChevronRight } from "./Icons";
import { useEffect, useRef, useState } from "react";
import { MODELS, findModel } from "../../ai-catalog.mjs";

// Pemilih model: tombol + panel kartu, menggantikan <select> bawaan browser
// yang tampil sebagai daftar datar tanpa gaya. Setiap model dapat avatar
// berhuruf depan dengan warna khas keluarganya, dan yang aktif ditandai centang.
//
// ponytail: posisi panel dipatok di bawah tombol lewat CSS. Kalau nanti dipakai
// di dekat tepi bawah layar, ganti ke Popover API (`popover=""` + anchor
// positioning) supaya membalik sendiri.

// Warna diturunkan dari nama, bukan disimpan per model: menambah model baru
// tidak perlu memilih warna dan tidak ada tabel yang bisa lupa diperbarui.
const hueOf = (label: string) => (label.charCodeAt(0) * 47 + label.length * 13) % 360;

export default function ModelPicker({ value, onChange, label = "Model AI" }: { value: string; onChange: (id: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const active = findModel(value) ?? MODELS[0];

  // Tutup saat klik di luar atau tekan Escape — panel bukan <select>, jadi
  // perilaku itu harus disediakan sendiri.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="model-picker" ref={box}>
      <button
        type="button"
        className="model-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${active.label}`}
        onClick={() => setOpen(!open)}
      >
        <span className="model-avatar" style={{ "--hue": hueOf(active.label) } as React.CSSProperties} aria-hidden="true">
          {active.label[0]}
        </span>
        <span className="model-name">{active.label}</span>
        <ChevronRight />
      </button>
      {open && (
        <div
          className="model-pop"
          role="listbox"
          aria-label={label}
          /* Gulirkan model aktif ke dalam pandangan saat panel dibuka, supaya
             pilihan sekarang tidak tersembunyi di bawah atau terpotong separuh
             di tepi panel. Badan blok wajib: nilai balik ref callback dianggap
             fungsi cleanup oleh React. */
          ref={(el) => {
            el?.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
          }}
        >
          {MODELS.map((m) => (
            <button
              type="button"
              key={m.id}
              role="option"
              aria-selected={m.id === value}
              className={`model-opt${m.id === value ? " is-active" : ""}`}
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
            >
              <span className="model-avatar" style={{ "--hue": hueOf(m.label) } as React.CSSProperties} aria-hidden="true">
                {m.label[0]}
              </span>
              <span className="model-name">{m.label}</span>
              {m.id === value && <Check />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
