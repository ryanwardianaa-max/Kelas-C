import test from 'node:test';
import assert from 'node:assert/strict';
import { gaussianElimination } from '../public/tools/lab-metode-numerik/core.js';

const close = (actual, expected, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

const vectorClose = (actual, expected, tolerance = 1e-8) => {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => close(value, expected[index], tolerance));
};

const matrixClose = (actual, expected, tolerance = 1e-8) => {
  assert.equal(actual.length, expected.length);
  actual.forEach((row, i) => {
    assert.equal(row.length, expected[i].length);
    row.forEach((val, j) => close(val, expected[i][j], tolerance));
  });
};

const computeResidualNorm = (A, b, x) => {
  const r = A.map((row, i) => {
    const ax = row.reduce((sum, val, j) => sum + val * x[j], 0);
    return ax - b[i];
  });
  const norm2 = Math.sqrt(r.reduce((sum, val) => sum + val * val, 0));
  const normInf = Math.max(...r.map(Math.abs));
  return { r, norm2, normInf };
};

test('Preset 3x3 Baku (Silabus P06 Metode Numerik Bu Linda): swap bertahap, faktor bersih, solusi integer', () => {
  const A = [
    [1, 2, 1],
    [4, -2, 2],
    [2, 4, -2]
  ];
  const b = [4, -2, 12];

  const result = gaussianElimination(A, b);

  // Solusi eksak x = [1, 2, -1]
  vectorClose(result.solution, [1, 2, -1]);

  // Matriks segitiga atas U dan vektor b'
  matrixClose(result.upper, [
    [4, -2, 2],
    [0, 5, -3],
    [0, 0, 2]
  ]);
  vectorClose(result.transformedVector, [-2, 13, -2]);

  // Residu ||Ax - b|| = 0
  const res = computeResidualNorm(A, b, result.solution);
  close(res.norm2, 0);
  close(res.normInf, 0);

  // Verifikasi riwayat langkah eliminasi
  assert.equal(result.steps.length, 8);
  assert.equal(result.steps[0].operation, 'swap');
  assert.deepEqual(result.steps[0].rows, [0, 1]); // R1 <-> R2
  assert.equal(result.steps[1].factor, 0.25); // m_21 = 1/4
  assert.equal(result.steps[2].factor, 0.5);  // m_31 = 2/4
  assert.equal(result.steps[3].operation, 'swap');
  assert.deepEqual(result.steps[3].rows, [1, 2]); // R2 <-> R3
  assert.equal(result.steps[4].factor, 0.5);  // m_32 = 2.5/5
});

test('Preset 4x4 Baku (Silabus P06 Metode Numerik Bu Linda): swap penuh, eliminasi maju & mundur, residu nol', () => {
  const A = [
    [1, -1, 2, -1],
    [4, 2, -2, 2],
    [2, 4, 1, -2],
    [2, -2, 4, 1]
  ];
  const b = [3, 4, -6, 15];

  const result = gaussianElimination(A, b);

  // Solusi eksak x = [1, -1, 2, 3]
  vectorClose(result.solution, [1, -1, 2, 3]);

  // Matriks segitiga atas U dan vektor b'
  matrixClose(result.upper, [
    [4, 2, -2, 2],
    [0, 3, 2, -3],
    [0, 0, 7, -3],
    [0, 0, 0, -1.5]
  ]);
  vectorClose(result.transformedVector, [4, -8, 5, -4.5]);

  // Residu ||Ax - b|| = 0
  const res = computeResidualNorm(A, b, result.solution);
  close(res.norm2, 0);
  close(res.normInf, 0);

  // Verifikasi operasi swap pada setiap kolom poros
  const swaps = result.steps.filter(s => s.operation === 'swap');
  assert.equal(swaps.length, 3);
  assert.deepEqual(swaps[0].rows, [0, 1]); // R1 <-> R2
  assert.deepEqual(swaps[1].rows, [1, 2]); // R2 <-> R3
  assert.deepEqual(swaps[2].rows, [2, 3]); // R3 <-> R4
});
