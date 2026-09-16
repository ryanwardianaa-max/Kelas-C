import test from 'node:test';
import assert from 'node:assert/strict';
import { regulaFalsi, modifiedRegulaFalsi } from '../public/tools/lab-metode-numerik/core.js';

test('modifiedRegulaFalsi converges faster than standard regulaFalsi on stagnant functions', () => {
  const f = (x) => Math.exp(x) - 5 * x * x;
  const standard = regulaFalsi(f, 0, 1, { tolerance: 1e-6, maxIterations: 50 });
  const modified = modifiedRegulaFalsi(f, 0, 1, { tolerance: 1e-6, maxIterations: 50 });

  assert.equal(standard.converged, true);
  assert.equal(modified.converged, true);
  // Modified Regula Falsi should break the stagnant point and take fewer iterations
  assert.ok(modified.iterations.length < standard.iterations.length, `Expected modified (${modified.iterations.length}) < standard (${standard.iterations.length})`);
  assert.ok(Math.abs(f(modified.root)) <= 1e-6);
});

test('modifiedRegulaFalsi solves textbook polynomial f(x) = x^3 - x - 2 on [1, 2]', () => {
  const f = (x) => x ** 3 - x - 2;
  const res = modifiedRegulaFalsi(f, 1, 2, { tolerance: 1e-6, maxIterations: 30 });
  assert.equal(res.converged, true);
  assert.ok(Math.abs(res.root - 1.5213797) < 1e-4);
  assert.ok(Math.abs(f(res.root)) < 1e-5);
});
