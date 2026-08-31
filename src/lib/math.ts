// Balasan AI dipecah menjadi potongan teks, tebal, kode, dan matematika, lalu
// LaTeX-nya dirender KaTeX ke MathML supaya tampil sebagai notasi matematika
// sungguhan (pecahan bertingkat, akar, integral), bukan kode "\frac{a}{b}".
//
// MathML dipilih, bukan keluaran HTML KaTeX: browser merendernya sendiri
// sehingga tidak perlu katex.min.css maupun berkas font apa pun.
// ponytail: KaTeX ikut bundel utama (+~270 KB). Kalau muat-pertama terasa
// berat, pindahkan AIAssistantDrawer ke React.lazy supaya KaTeX ikut terpisah.
import katex from "katex";

export type Segment =
  | { kind: "text" | "bold" | "code"; value: string }
  | { kind: "math"; value: string; display: boolean };

// Urutan penting: $$ diuji sebelum $, \[ sebelum \(, supaya delimiter panjang
// tidak dimakan sepotong oleh delimiter pendek.
const TOKEN =
  /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^\n$]+?)\$|\\\(([^\n]+?)\\\)|\*\*([^\n*]+?)\*\*|`([^\n`]+?)`/g;

export function segments(input: unknown): Segment[] {
  const text = typeof input === "string" ? input : "";
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ kind: "text", value: text.slice(last, at) });
    const [, blockDollar, blockBracket, inlineDollar, inlineParen, bold, code] = m;
    if (blockDollar !== undefined) out.push({ kind: "math", value: blockDollar.trim(), display: true });
    else if (blockBracket !== undefined) out.push({ kind: "math", value: blockBracket.trim(), display: true });
    else if (inlineDollar !== undefined) out.push({ kind: "math", value: inlineDollar.trim(), display: false });
    else if (inlineParen !== undefined) out.push({ kind: "math", value: inlineParen.trim(), display: false });
    else if (bold !== undefined) out.push({ kind: "bold", value: bold });
    else if (code !== undefined) out.push({ kind: "code", value: code });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}

// throwOnError: false → LaTeX rusak dari AI tampil sebagai teks merah, tidak
// menjatuhkan seluruh balasan. trust: false → \href dan \includegraphics
// ditolak, jadi keluaran aman dipasang lewat innerHTML.
export function toMathML(tex: string, display = false): string {
  return katex.renderToString(tex, {
    output: "mathml",
    displayMode: display,
    throwOnError: false,
    trust: false,
    strict: false,
  });
}
