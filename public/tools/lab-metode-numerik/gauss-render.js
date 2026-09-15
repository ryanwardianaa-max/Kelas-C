export function texNum(v, maxDecimals = 4) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  if (Number.isInteger(v)) return String(v);
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(v * factor) / factor;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

export function texAugmented(matrix, vector) {
  if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(vector)) return '';
  const cols = 'c'.repeat(matrix[0].length);
  const rows = matrix.map((row, i) => `${row.map(x => texNum(x)).join(' & ')} & ${texNum(vector[i])}`).join(' \\\\ ');
  return `\\left[\\begin{array}{${cols}|c} ${rows} \\end{array}\\right]`;
}

export function texGaussStep(step) {
  if (!step) return '';
  if (step.operation === 'swap') {
    const [r1, r2] = step.rows;
    return `R_{${r1 + 1}} \\leftrightarrow R_{${r2 + 1}} \\implies ${texAugmented(step.matrix, step.vector)}`;
  }
  if (step.operation === 'eliminate') {
    const r = step.row + 1;
    const p = step.pivotRow + 1;
    const m = texNum(step.factor);
    return `R_{${r}} \\leftarrow R_{${r}} - (${m})R_{${p}} \\implies ${texAugmented(step.matrix, step.vector)}`;
  }
  if (step.operation === 'normalize') {
    const r = step.row + 1;
    const d = texNum(step.divisor);
    return `R_{${r}} \\leftarrow \\frac{R_{${r}}}{${d}} \\implies ${texAugmented(step.matrix, step.vector)}`;
  }
  if (step.operation === 'back-substitute') {
    const i = step.row + 1;
    const rhs = texNum(step.rhs ?? step.value);
    const div = texNum(step.divisor ?? 1);
    const val = texNum(step.value);
    if (!step.substitutions || step.substitutions.length === 0) {
      return `x_{${i}} = \\frac{${rhs}}{${div}} = ${val}`;
    }
    const subExpr = step.substitutions.map(s => `(${texNum(s.coeff)})(${texNum(s.value)})`).join(' + ');
    const num = texNum(step.sum);
    return `x_{${i}} = \\frac{${rhs} - [${subExpr}]}{${div}} = \\frac{${num}}{${div}} = ${val}`;
  }
  return '';
}
