// Penjaga tampilan matematika: balasan AI harus terpecah benar dan LaTeX-nya
// menjadi MathML, bukan teks "\frac{...}". Menjalankan fungsi sungguhan, bukan
// mencocokkan teks kode.
import assert from "node:assert/strict";
import { segments, toMathML } from "../src/lib/math.ts";

// 1. Rumus dalam kalimat: $...$ dan \(...\) jadi math inline.
{
  const s = segments("Turunan $x^2$ adalah \\(2x\\) saja.");
  assert.deepEqual(s.map((x) => x.kind), ["text", "math", "text", "math", "text"]);
  assert.equal(s[1].value, "x^2");
  assert.equal(s[1].display, false);
  assert.equal(s[3].value, "2x");
}

// 2. Rumus berdiri sendiri: $$...$$ dan \[...\] jadi math display.
{
  const s = segments("Hasilnya:\n$$\\int_0^1 x^3\\,dx = \\frac14$$\nselesai.");
  const math = s.filter((x) => x.kind === "math");
  assert.equal(math.length, 1);
  assert.equal(math[0].display, true, "$$ harus display, bukan inline");
  assert.equal(math[0].value, "\\int_0^1 x^3\\,dx = \\frac14");
  assert.equal(segments("\\[a^2+b^2=c^2\\]")[0].display, true);
}

// 3. $$ tidak boleh dimakan sepotong oleh $ (regresi delimiter).
{
  const s = segments("$$a$$");
  assert.equal(s.length, 1);
  assert.equal(s[0].value, "a");
  assert.equal(s[0].display, true);
}

// 4. Tebal dan kode tetap jalan; teks biasa utuh tanpa kehilangan karakter.
{
  const src = "Ini **penting** dan `npm run build` ya.";
  const s = segments(src);
  assert.deepEqual(s.map((x) => x.kind), ["text", "bold", "text", "code", "text"]);
  assert.equal(s.map((x) => x.value).join("").length, src.length - "****``".length);
}

// 5. Rumus multi-baris di dalam $$ tidak terputus.
{
  const s = segments("$$\\begin{aligned}\na &= b\\\\\nc &= d\n\\end{aligned}$$");
  assert.equal(s.length, 1);
  assert.ok(s[0].value.includes("aligned"));
}

// 6. Masukan bukan string tidak melempar (balasan AI bisa null/objek).
for (const bad of [null, undefined, 42, {}, []]) assert.deepEqual(segments(bad), []);

// 7. Render menghasilkan MathML sungguhan, bukan LaTeX mentah.
//    Catatan: MathML standar menyimpan LaTeX asli di <annotation encoding=
//    "application/x-tex"> supaya rumus bisa disalin; itu tidak ikut tampil,
//    jadi annotation dibuang dulu sebelum diperiksa.
{
  const out = toMathML("\\frac{x^2}{2}");
  const visible = out.replace(/<annotation[\s\S]*?<\/annotation>/g, "");
  assert.ok(out.includes("<math"), "keluaran harus MathML");
  assert.ok(out.includes("<mfrac"), "pecahan harus jadi mfrac");
  assert.ok(!visible.includes("\\frac"), "LaTeX mentah tidak boleh tampil");
  assert.ok(!out.includes("katex-html"), "output HTML/font KaTeX tidak dipakai");
}

// 8. displayMode menandai blok, bukan inline.
{
  assert.match(toMathML("x", true), /display="block"/);
  assert.doesNotMatch(toMathML("x", false), /display="block"/);
}

// 9. LaTeX rusak dari AI tampil sebagai error, tidak melempar dan tidak
//    menjatuhkan seluruh balasan.
{
  const out = toMathML("\\frac{a}{");
  assert.ok(out.includes("katex-error"), "LaTeX rusak harus jadi katex-error");
}

// 10. trust:false → \href tidak boleh menjadi tautan yang bisa diklik. KaTeX
//     menurunkannya jadi huruf-huruf biasa (<mi>j</mi><mi>a</mi>…), jadi yang
//     dijaga adalah tidak ada anchor dan tidak ada atribut href.
{
  const out = toMathML("\\href{javascript:alert(1)}{klik}");
  assert.ok(!/<a[\s>]/i.test(out), "\\href tidak boleh menjadi anchor");
  assert.ok(!/href\s*=/i.test(out), "atribut href tidak boleh lolos");
  assert.ok(!/on\w+\s*=/i.test(out), "atribut event tidak boleh lolos");
}

// 11. Ujung ke ujung: balasan campuran menghasilkan MathML untuk tiap rumus.
{
  const reply = "Akar dari $x^2=9$ adalah:\n$$x = \\pm 3$$";
  const html = segments(reply).map((s) => (s.kind === "math" ? toMathML(s.value, s.display) : s.value)).join("");
  assert.equal((html.match(/<math/g) ?? []).length, 2);
  assert.ok(html.includes("±"), "\\pm harus jadi simbol ±, bukan kode");
  assert.ok(!html.replace(/<annotation[\s\S]*?<\/annotation>/g, "").includes("\\pm"));
}

console.log("math rendering guard: OK");
