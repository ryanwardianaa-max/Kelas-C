import json, html, pathlib, re

ROOT = pathlib.Path(r"C:/Users/LATITUDE 3310 TOUCH/Documents/DOCUMENT RYAN/02_Kuliah/Semester_7/class-productivity-app")
WORK = ROOT / ".hermes/work"
OUT = ROOT / "public/materi/KP21517001"
SOURCE_BASE = "https://informatika.stei.itb.ac.id/~rinaldi.munir/Buku/Metode%20Numerik/"
CHAPTERS = {
  1: ("Bab 01 — Metode Numerik Secara Umum", SOURCE_BASE + "BAb-%2001%20Metode%20Numerik%20Secara%20Umum.pdf"),
  2: ("Bab 02 — Deret Taylor dan Analisis Galat", SOURCE_BASE + "pdf/BAb-%2002%20Deret%20Taylor%20dan%20Analisis%20Galat.pdf"),
  3: ("Bab 03 — Solusi Persamaan Nirlanjar", SOURCE_BASE + "pdf/BAb-%2003%20Solusi%20Persamaan%20Nirlanjar.pdf"),
  4: ("Bab 04 — Solusi Sistem Persamaan Lanjar", SOURCE_BASE + "pdf/BAb-%2004%20Solusi%20Sistem%20Persamaan%20Lanjar.pdf"),
  5: ("Bab 05 — Interpolasi Polinom", SOURCE_BASE + "pdf/BAb-%2005%20Interpolasi%20Polinom.pdf"),
  6: ("Bab 06 — Integrasi Numerik", SOURCE_BASE + "pdf/BAb-%2006%20Integrasi%20Numerik.pdf"),
  7: ("Bab 07 — Turunan Numerik", SOURCE_BASE + "pdf/BAb-%2007%20Turunan%20Numerik.pdf"),
  8: ("Bab 08 — Solusi Persamaan Diferensial Biasa", SOURCE_BASE + "pdf/BAb-%2008%20Solusi%20Persamaan%20Diferensial%20Biasa.pdf"),
}
SOURCE_BY_MEETING = {1:[1],2:[2],3:[3],4:[3],5:[3],6:[4],7:[4],8:[1,2,3,4],9:[5],10:[5],11:[7],12:[6],13:[6],14:[8],15:[8],16:list(range(1,9))}

def esc(value): return html.escape(str(value), quote=True)
def math_block(value): return f'<div class="math-step-box">$${esc(value)}$$</div>'
def inline_text(value):
    # Preserve explicit KaTeX delimiters while escaping HTML.
    return esc(value)

def section_html(index, section):
    title = re.sub(r'^\s*\d+\.\s*', '', section.get('title', ''))
    paragraphs = ''.join(f'<p>{inline_text(p)}</p>' for p in section.get('paragraphs', []))
    formulas = ''.join(f'<div class="card formula"><div class="formula-label">Rumus</div>{math_block(f)}</div>' for f in section.get('formulas', []))
    ex = section.get('example') or {}
    example = ''
    if ex:
        steps = ''.join(f'<li>{inline_text(s)}</li>' for s in ex.get('steps', []))
        example = f'''<div class="card example"><div class="formula-label">Contoh bertahap</div><p><strong>Soal:</strong> {inline_text(ex.get('question',''))}</p><ol class="steps">{steps}</ol><p class="answer"><strong>Jawaban:</strong> {inline_text(ex.get('answer',''))}</p></div>'''
    warning = section.get('warning')
    warn = f'<div class="card warn"><strong>Hati-hati:</strong> {inline_text(warning)}</div>' if warning else ''
    return f'<section><h2>{index}. {esc(title)}</h2>{paragraphs}{formulas}{example}{warn}</section>'

def page(item):
    n = int(item['no']); nn = f'{n:02d}'
    sections = ''.join(section_html(i, s) for i,s in enumerate(item.get('sections', []), 1))
    summary = ''.join(f'<li>{inline_text(x)}</li>' for x in item.get('summary', []))
    exercises = ''.join(f'<li>{inline_text(x)}</li>' for x in item.get('exercises', []))
    sources = ''.join(f'<li>[{i+1}] <a href="{esc(CHAPTERS[c][1])}" target="_blank" rel="noreferrer">{esc(CHAPTERS[c][0])} — Rinaldi Munir</a></li>' for i,c in enumerate(SOURCE_BY_MEETING[n]))
    prev_link = f'/materi/KP21517001/pertemuan-{n-1:02d}/index.html' if n > 1 else ''
    next_link = f'/materi/KP21517001/pertemuan-{n+1:02d}/index.html' if n < 16 else ''
    pager = (f'<a href="{prev_link}">← Pertemuan {n-1:02d}</a>' if prev_link else '<span></span>') + (f'<a href="{next_link}">Pertemuan {n+1:02d} →</a>' if next_link else '<span></span>')
    return f'''<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pertemuan {nn} — {esc(item['title'])}</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"><link rel="stylesheet" href="../shared.css"><script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script><script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script></head>
<body><div class="page"><nav class="top-nav"><a class="back" href="/?course=KP21517001" onclick="handleGoBack(event)">← Kembali ke Metode Numerik</a><span>Pertemuan {nn}/16</span></nav>
<header><span class="badge">Bahan Belajar · Pertemuan {nn}</span><h1>{esc(item['title'])}</h1><p>{inline_text(item.get('bridge',''))}</p><div class="meta"><span><strong>Mata kuliah:</strong> Metode Numerik (KP21517001)</span><span><strong>Dosen:</strong> Elis Nurhayati, M.Pd.</span><span><strong>SKS / Kelas:</strong> 3 SKS / Kelas C</span><span><strong>Rujukan:</strong> Buku Metode Numerik — Rinaldi Munir, STEI ITB</span></div></header>
<main><aside class="notice"><strong>Status materi:</strong> bahan belajar terstruktur, bukan klaim catatan kuliah yang sudah berlangsung. Sesuaikan dengan penjelasan dosen di kelas.</aside>{sections}
<section><h2>Ringkasan</h2><div class="card summary"><ul>{summary}</ul></div></section>
<section><h2>Latihan Mandiri</h2><div class="card exercise"><ol>{exercises}</ol></div></section>
<div class="tool-cta"><div><strong>Coba dengan angka sendiri</strong><p>Laboratorium menampilkan langkah, tabel iterasi, hasil, dan grafik.</p></div><a href="/tools/lab-metode-numerik/index.html">Buka Laboratorium</a></div>
<section><h2>Berikutnya</h2><p>{inline_text(item.get('next',''))}</p></section>
<section class="sources"><h2>Sumber</h2><ol>{sources}</ol></section><nav class="pager">{pager}</nav></main>
<footer>Disusun untuk belajar Metode Numerik Kelas C · Rumus dirender dengan KaTeX</footer></div><script>function handleGoBack(e){{if(history.length>1){{e.preventDefault();history.back()}}}}document.addEventListener('DOMContentLoaded',()=>renderMathInElement(document.body,{{delimiters:[{{left:'$$',right:'$$',display:true}},{{left:'$',right:'$',display:false}},{{left:'\\\\(',right:'\\\\)',display:false}}],throwOnError:false}}));</script></body></html>'''

def main():
    all_items=[]
    for name in ['metnum-p01-04.json','metnum-p05-08.json','metnum-p09-12.json','metnum-p13-16.json']:
        all_items.extend(json.loads((WORK/name).read_text(encoding='utf-8')))
    assert [int(x['no']) for x in all_items] == list(range(1,17))
    OUT.mkdir(parents=True, exist_ok=True)
    for item in all_items:
        folder=OUT/f"pertemuan-{int(item['no']):02d}"; folder.mkdir(parents=True,exist_ok=True)
        (folder/'index.html').write_text(page(item),encoding='utf-8')
    print(f'generated {len(all_items)} pages')
if __name__ == '__main__': main()
