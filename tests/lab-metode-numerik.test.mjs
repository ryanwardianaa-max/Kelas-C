import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateErrors, absoluteError, relativeError, percentageError, taylorSeries,
  bisection, regulaFalsi, fixedPoint, newton, secant,
  gaussianElimination, gaussJordan, luDecomposition, jacobi, gaussSeidel,
  lagrange, newtonInterpolation, linearRegression, finiteDifference,
  trapezoid, simpson13, simpson38, gaussLegendre, euler, heun, rk4,
} from '../public/tools/lab-metode-numerik/core.js';

const close = (actual, expected, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const vectorClose = (actual, expected, tolerance = 1e-8) => {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => close(value, expected[index], tolerance));
};
const hasSteps = result => assert.ok(Array.isArray(result.steps) && result.steps.length > 0);

test('error metrics and Taylor series return UI-ready details', () => {
  assert.deepEqual(calculateErrors(10, 9), { absolute: 1, relative: 0.1, percentage: 10 });
  assert.equal(absoluteError(10, 9), 1);
  assert.equal(relativeError(10, 9), 0.1);
  assert.equal(percentageError(10, 9), 10);
  const result = taylorSeries([() => 1, () => 1, () => 1, () => 1], 1, 0);
  close(result.value, 8 / 3);
  assert.equal(result.terms.length, 4);
  assert.throws(() => relativeError(0, 1), /zero/i);
  assert.throws(() => taylorSeries([], 1, 0), /derivative/i);
});

test('bracketing root methods solve x²-2 and validate intervals', () => {
  const f = x => x * x - 2;
  for (const solve of [bisection, regulaFalsi]) {
    const result = solve(f, 1, 2, { tolerance: 1e-10, maxIterations: 100 });
    close(result.root, Math.SQRT2, 1e-8);
    assert.equal(result.converged, true);
    assert.ok(result.iterations.length > 0);
  }
  assert.equal(bisection(f, Math.SQRT2, 2).root, Math.SQRT2);
  assert.throws(() => bisection(f, 2, 3), /bracket|sign/i);
  assert.throws(() => regulaFalsi(() => 1, 0, 1), /bracket|sign/i);
});

test('open root methods converge and expose iteration data', () => {
  const f = x => x * x - 2;
  const results = [
    fixedPoint(x => (x + 2 / x) / 2, 1, { tolerance: 1e-10 }),
    newton(f, x => 2 * x, 1, { tolerance: 1e-10 }),
    secant(f, 1, 2, { tolerance: 1e-10 }),
  ];
  results.forEach(result => {
    close(result.root, Math.SQRT2, 1e-8);
    assert.equal(result.converged, true);
    assert.ok(result.iterations.length > 0);
  });
  assert.throws(() => newton(f, () => 0, 1), /derivative|zero/i);
  assert.throws(() => secant(() => 1, 0, 1), /denominator|zero/i);
  const capped = fixedPoint(x => x + 1, 0, { maxIterations: 3 });
  assert.equal(capped.converged, false);
  assert.equal(capped.iterations.length, 3);
});

test('direct linear solvers handle pivoting and singular matrices', () => {
  const A = [[0, 2], [1, 3]];
  const b = [4, 5];
  for (const solve of [gaussianElimination, gaussJordan]) {
    const result = solve(A, b);
    vectorClose(result.solution, [-1, 2]);
    hasSteps(result);
  }
  assert.throws(() => gaussianElimination([[1, 2], [2, 4]], [3, 6]), /singular/i);
  assert.throws(() => gaussJordan([[1, 2], [2, 4]], [3, 6]), /singular/i);
});

test('LU decomposition reconstructs a pivoted matrix', () => {
  const A = [[0, 2], [1, 3]];
  const result = luDecomposition(A);
  assert.deepEqual(result.P, [[0, 1], [1, 0]]);
  const multiply = (X, Y) => X.map(row => Y[0].map((_, j) => row.reduce((s, v, k) => s + v * Y[k][j], 0)));
  assert.deepEqual(multiply(result.P, A), multiply(result.L, result.U));
  hasSteps(result);
  assert.throws(() => luDecomposition([[1, 2], [2, 4]]), /singular/i);
});

test('iterative linear solvers converge and enforce nonzero diagonal', () => {
  const A = [[4, 1], [2, 3]];
  const b = [1, 2];
  for (const solve of [jacobi, gaussSeidel]) {
    const result = solve(A, b, { tolerance: 1e-10, maxIterations: 200 });
    vectorClose(result.solution, [0.1, 0.6], 1e-8);
    assert.equal(result.converged, true);
    assert.ok(result.iterations.length > 0);
  }
  assert.throws(() => jacobi([[0, 1], [1, 2]], [1, 2]), /diagonal/i);
});

test('interpolation and regression produce correct models', () => {
  const points = [[0, 1], [1, 3], [2, 7]];
  const l = lagrange(points, 1.5);
  const n = newtonInterpolation(points, 1.5);
  close(l.value, 4.75);
  close(n.value, 4.75);
  hasSteps(l);
  hasSteps(n);
  assert.throws(() => lagrange([[0, 1], [0, 2]], 1), /distinct|duplicate/i);
  const regression = linearRegression([[1, 2], [2, 4], [3, 6]]);
  close(regression.slope, 2);
  close(regression.intercept, 0);
  close(regression.r2, 1);
  close(regression.predict(4), 8);
  hasSteps(regression);
  assert.throws(() => linearRegression([[1, 2], [1, 3]]), /variance|distinct/i);
});

test('finite differences support forward, backward, central, second derivative', () => {
  const f = x => x * x * x;
  close(finiteDifference(f, 2, 1e-4, 'central').value, 12, 1e-7);
  close(finiteDifference(f, 2, 1e-5, 'forward').value, 12, 1e-3);
  close(finiteDifference(f, 2, 1e-5, 'backward').value, 12, 1e-3);
  close(finiteDifference(f, 2, 1e-3, 'second').value, 12, 1e-5);
  hasSteps(finiteDifference(f, 2, 1e-4));
  assert.throws(() => finiteDifference(f, 2, 0), /step|positive/i);
  assert.throws(() => finiteDifference(f, 2, 1, 'mystery'), /method/i);
});

test('quadrature methods integrate polynomials and expose samples', () => {
  close(trapezoid(x => x * x, 0, 1, 100).value, 1 / 3, 2e-5);
  close(simpson13(x => x ** 3, 0, 1, 10).value, 1 / 4);
  close(simpson38(x => x ** 3, 0, 1, 12).value, 1 / 4);
  close(gaussLegendre(x => x ** 3, 0, 1, 3).value, 1 / 4);
  hasSteps(trapezoid(x => x, 0, 1, 2));
  assert.throws(() => simpson13(x => x, 0, 1, 3), /even/i);
  assert.throws(() => simpson38(x => x, 0, 1, 4), /multiple.*3/i);
  assert.throws(() => gaussLegendre(x => x, 0, 1, 6), /order/i);
});

test('ODE methods solve y′=y and return full trajectories', () => {
  const f = (_x, y) => y;
  const e = euler(f, 0, 1, 1, 0.1);
  const h = heun(f, 0, 1, 1, 0.1);
  const r = rk4(f, 0, 1, 1, 0.1);
  close(e.y, 2.5937424601, 1e-10);
  close(h.y, Math.E, 0.005);
  close(r.y, Math.E, 3e-6);
  for (const result of [e, h, r]) {
    close(result.x, 1);
    assert.equal(result.points.length, 11);
    hasSteps(result);
  }
  const reverse = rk4(f, 1, Math.E, 0, 0.1);
  close(reverse.y, 1, 1e-5);
  assert.throws(() => euler(f, 0, 1, 1, 0), /step|positive/i);
});

test('all methods reject non-finite values and invalid shapes/options', () => {
  assert.throws(() => bisection(x => x, 1, 0), /interval|less/i);
  assert.throws(() => newton(() => NaN, () => 1, 0), /finite/i);
  assert.throws(() => gaussianElimination([[1, 2]], [1]), /square/i);
  assert.throws(() => jacobi([[1]], [1], { maxIterations: 0 }), /maxIterations/i);
  assert.throws(() => trapezoid(x => x, 0, 1, 0), /subinterval/i);
  assert.throws(() => rk4(() => Infinity, 0, 1, 1, 0.1), /finite/i);
});
