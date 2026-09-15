import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('kalkulator-matriks HTML script is valid and executes Gauss elimination with KaTeX', () => {
  const html = fs.readFileSync('public/tools/kalkulator-matriks/index.html', 'utf8');
  assert.ok(html.includes('gaussEliminationSPL'));
  assert.ok(html.includes('badge-swap'));
  assert.ok(html.includes('badge-elim'));
  assert.ok(html.includes('badge-upper'));
  assert.ok(html.includes('badge-subst'));
  assert.ok(html.includes('badge-sol'));

  // Ensure augTex has proper closing \\right]
  assert.ok(html.includes('\\\\end{array}\\\\right]'));
});
