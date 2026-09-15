import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';

// Test Fraction class
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
class F {
  constructor(n = 0, d = 1) {
    if (!d) throw Error('Penyebut tidak boleh nol.');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    this.n = n / g; this.d = d / g;
  }
  add(x) { return new F(this.n * x.d + x.n * this.d, this.d * x.d); }
  sub(x) { return new F(this.n * x.d - x.n * this.d, this.d * x.d); }
  mul(x) { return new F(this.n * x.n, this.d * x.d); }
  div(x) { if (!x.n) throw Error('Pembagian dengan nol.'); return new F(this.n * x.d, this.d * x.n); }
  neg() { return new F(-this.n, this.d); }
  eq0() { return this.n === 0; }
  toString() { return this.d === 1 ? `${this.n}` : `${this.n}/${this.d}`; }
  tex() { return this.d === 1 ? `${this.n}` : `\\frac{${this.n}}{${this.d}}`; }
}

const augTex = (M, n) => `\\left[\\begin{array}{${'c'.repeat(n)}|c}${M.map(r => r.map(x => x.tex()).join(' & ')).join(' \\\\ ')}\\end{array}\\right]`;

function gaussEliminationSPL(A, B, n) {
  let X = A.map((r, i) => r.concat(B[i]));
  let steps = [];

  steps.push({
    badge: 'Matriks Gandengan [A|b]',
    badgeClass: 'badge-init',
    title: 'Bentuk Matriks Gandengan Awal [A|b]',
    desc: 'Tuliskan matriks koefisien A berdampingan dengan vektor konstanta b:',
    tex: `[A\\mid b] = ${augTex(X, n)}`
  });

  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c; r < n; r++) {
      if (!X[r][c].eq0()) {
        const valR = Math.abs(Number(X[r][c].n) / Number(X[r][c].d));
        const valP = Math.abs(Number(X[p][c].n) / Number(X[p][c].d));
        if (X[p][c].eq0() || valR > valP) p = r;
      }
    }

    if (X[p][c].eq0()) {
      throw Error(`Matriks singular: kolom ${c + 1} tidak memiliki elemen pivot tak-nol.`);
    }

    if (p !== c) {
      [X[p], X[c]] = [X[c], X[p]];
      steps.push({
        badge: `Tukar Baris: R${c + 1} ↔ R${p + 1}`,
        badgeClass: 'badge-swap',
        title: `Pivoting Sebagian: R${c + 1} ↔ R${p + 1}`,
        desc: `Elemen pivot diagonal baris ${c + 1} bernilai 0 atau lebih kecil dari baris ${p + 1}. Baris ditukar agar perhitungan stabil:`,
        tex: augTex(X, n)
      });
    }

    const pivot = X[c][c];

    for (let r = c + 1; r < n; r++) {
      if (!X[r][c].eq0()) {
        const factor = X[r][c].div(pivot);
        X[r] = X[r].map((x, j) => x.sub(factor.mul(X[c][j])));
        steps.push({
          badge: `R${r + 1} ← R${r + 1} − (${factor.toString()})R${c + 1}`,
          badgeClass: 'badge-elim',
          title: `Eliminasi Baris ${r + 1}`,
          desc: `Nol-kan elemen kolom ${c + 1} baris ${r + 1} dengan faktor pengali m_{${r + 1}${c + 1}} = ${factor.tex()}:`,
          tex: augTex(X, n)
        });
      }
    }
  }

  steps.push({
    badge: 'Matriks Segitiga Atas',
    badgeClass: 'badge-upper',
    title: 'Matriks Segitiga Atas (Eselon Baris)',
    desc: 'Seluruh elemen di bawah diagonal utama telah menjadi nol. Sistem siap diselesaikan melalui substitusi mundur:',
    tex: `U = ${augTex(X, n)}`
  });

  let sol = Array(n).fill(null);
  for (let i = n - 1; i >= 0; i--) {
    const rhs = X[i][n];
    let subSum = new F(0);
    let subTerms = [];

    for (let j = i + 1; j < n; j++) {
      const coeff = X[i][j];
      if (!coeff.eq0()) {
        subSum = subSum.add(coeff.mul(sol[j]));
        subTerms.push(`(${coeff.tex()})(${sol[j].tex()})`);
      }
    }

    const a_ii = X[i][i];
    if (a_ii.eq0()) throw Error(`Matriks singular pada baris ${i + 1}.`);

    const numerator = rhs.sub(subSum);
    const x_val = numerator.div(a_ii);
    sol[i] = x_val;

    let texStep = '';
    if (i === n - 1) {
      texStep = `${a_ii.tex()} x_{${i + 1}} = ${rhs.tex()} \\implies x_{${i + 1}} = \\frac{${rhs.tex()}}{${a_ii.tex()}} = ${x_val.tex()}`;
    } else {
      const exprSub = subTerms.length > 0 ? subTerms.join(' + ') : '0';
      texStep = `${a_ii.tex()} x_{${i + 1}} + ${exprSub} = ${rhs.tex()} \\implies ${a_ii.tex()} x_{${i + 1}} = ${numerator.tex()} \\implies x_{${i + 1}} = ${x_val.tex()}`;
    }

    steps.push({
      badge: `Substitusi Mundur: x${i + 1}`,
      badgeClass: 'badge-subst',
      title: `Substitusi Mundur Baris ${i + 1}`,
      desc: `Substitusikan nilai variabel yang sudah diperoleh ke persamaan baris ${i + 1}:`,
      tex: texStep
    });
  }

  steps.push({
    badge: 'Himpunan Solusi',
    badgeClass: 'badge-sol',
    title: 'Vektor Solusi Akhir',
    desc: 'Himpunan penyelesaian sistem persamaan linear diperoleh:',
    tex: `\\mathbf{x} = \\begin{bmatrix}${sol.map((s, idx) => `x_{${idx + 1}} = ${s.tex()}`).join(' \\\\ ')}\\end{bmatrix}`
  });

  return { out: sol.map(x => [x]), steps };
}

test('Gaussian Elimination step-by-step 3x3 returns verified KaTeX equations and swaps', () => {
  const A = [
    [new F(1), new F(2), new F(1)],
    [new F(4), new F(-2), new F(2)],
    [new F(2), new F(4), new F(-2)]
  ];
  const B = [
    [new F(4)],
    [new F(-2)],
    [new F(12)]
  ];

  const res = gaussEliminationSPL(A, B, 3);
  assert.equal(res.out[0][0].toString(), '1');
  assert.equal(res.out[1][0].toString(), '2');
  assert.equal(res.out[2][0].toString(), '-1');

  // Verify that all KaTeX expressions are valid without throwing
  for (const step of res.steps) {
    assert.ok(step.badge, 'badge must exist');
    assert.ok(step.title, 'title must exist');
    const rendered = katex.renderToString(step.tex, { displayMode: true, throwOnError: true });
    assert.ok(rendered.length > 0);
  }

  // Check that row swaps were recorded
  const swaps = res.steps.filter(s => s.badgeClass === 'badge-swap');
  assert.equal(swaps.length, 2);

  // Check backward substitutions
  const backSubs = res.steps.filter(s => s.badgeClass === 'badge-subst');
  assert.equal(backSubs.length, 3);
});
