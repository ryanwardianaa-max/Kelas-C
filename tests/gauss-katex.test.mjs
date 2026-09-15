import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { gaussianElimination } from '../public/tools/lab-metode-numerik/core.js';
import { texNum, texAugmented, texGaussStep } from '../public/tools/lab-metode-numerik/gauss-render.js';

test('texNum formats integers and decimals cleanly', () => {
  assert.equal(texNum(3), '3');
  assert.equal(texNum(-0), '0');
  assert.equal(texNum(0.5), '0.5');
  assert.equal(texNum(1 / 3), '0.3333');
  assert.equal(texNum(NaN), '—');
});

test('texAugmented generates valid KaTeX augmented matrix', () => {
  const A = [[2, 1], [4, -1]];
  const b = [4, 5];
  const tex = texAugmented(A, b);
  assert.match(tex, /\\left\[\\begin\{array\}\{cc\|c\}/);
  assert.doesNotThrow(() => katex.renderToString(tex, { throwOnError: true }));
});

test('gaussianElimination steps provide full KaTeX expressions without errors', () => {
  const A = [
    [2, 1, -1],
    [-3, -1, 2],
    [-2, 1, 2],
  ];
  const b = [8, -11, -3];
  const result = gaussianElimination(A, b);

  assert.equal(result.solution.length, 3);
  assert.ok(result.steps.length > 0);

  // Every step must generate valid KaTeX syntax
  for (const step of result.steps) {
    const tex = texGaussStep(step);
    assert.ok(tex.length > 0, `Step ${step.operation} should have non-empty KaTeX`);
    assert.doesNotThrow(
      () => katex.renderToString(tex, { throwOnError: true }),
      `KaTeX should parse step: ${tex}`
    );
  }

  // Back substitution must contain row indices and division
  const backSteps = result.steps.filter(s => s.operation === 'back-substitute');
  assert.equal(backSteps.length, 3);
  assert.ok(backSteps[0].divisor !== undefined);
  assert.ok(backSteps[0].rhs !== undefined);
  assert.ok(Array.isArray(backSteps[0].substitutions));
});
