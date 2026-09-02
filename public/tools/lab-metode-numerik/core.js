const EPS = 1e-12;

function finiteNumber(value, name = 'value') {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be a finite number`);
  return value;
}

function callable(fn, name = 'function') {
  if (typeof fn !== 'function') throw new TypeError(`${name} must be a callback function`);
}

function evaluate(fn, args, name = 'function result') {
  const value = fn(...args);
  return finiteNumber(value, name);
}

function positiveInteger(value, name) {
  if (!Number.isInteger(value) || value <= 0) throw new RangeError(`${name} must be a positive integer`);
}

function optionsOf(options = {}) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('options must be an object');
  const tolerance = options.tolerance ?? 1e-8;
  const maxIterations = options.maxIterations ?? 100;
  finiteNumber(tolerance, 'tolerance');
  if (tolerance <= 0) throw new RangeError('tolerance must be positive');
  positiveInteger(maxIterations, 'maxIterations');
  return { tolerance, maxIterations };
}

export function absoluteError(exact, approximate) {
  finiteNumber(exact, 'exact value');
  finiteNumber(approximate, 'approximate value');
  return Math.abs(exact - approximate);
}

export function relativeError(exact, approximate) {
  finiteNumber(exact, 'exact value');
  if (exact === 0) throw new RangeError('relative error is undefined for an exact value of zero');
  return absoluteError(exact, approximate) / Math.abs(exact);
}

export function percentageError(exact, approximate) {
  return relativeError(exact, approximate) * 100;
}

export function calculateErrors(exact, approximate) {
  return {
    absolute: absoluteError(exact, approximate),
    relative: relativeError(exact, approximate),
    percentage: percentageError(exact, approximate),
  };
}

export const calculateError = calculateErrors;

export function numericalDerivative(fn, order, x) {
  callable(fn);
  finiteNumber(x, 'x');
  if (!Number.isInteger(order) || order < 0 || order > 8) throw new RangeError('derivative order must be an integer from 0 to 8');
  if (order === 0) return evaluate(fn, [x]);
  const radius = Math.max(4, order);
  const h = order <= 3 ? 0.03 : order <= 5 ? 0.08 : order <= 7 ? 0.15 : 0.3;
  const nodes = Array.from({ length: 2 * radius + 1 }, (_, i) => x + (i - radius) * h);
  const weights = nodes.map(() => Array(order + 1).fill(0));
  weights[0][0] = 1;
  let previousProduct = 1;
  let previousOffset = nodes[0] - x;
  for (let i = 1; i < nodes.length; i++) {
    const highest = Math.min(i, order);
    let product = 1;
    const offsetBefore = previousOffset;
    previousOffset = nodes[i] - x;
    for (let j = 0; j < i; j++) {
      const difference = nodes[i] - nodes[j];
      product *= difference;
      if (j === i - 1) {
        for (let k = highest; k >= 1; k--) weights[i][k] = previousProduct * (k * weights[i - 1][k - 1] - offsetBefore * weights[i - 1][k]) / product;
        weights[i][0] = -previousProduct * offsetBefore * weights[i - 1][0] / product;
      }
      for (let k = highest; k >= 1; k--) weights[j][k] = (previousOffset * weights[j][k] - k * weights[j][k - 1]) / difference;
      weights[j][0] = previousOffset * weights[j][0] / difference;
    }
    previousProduct = product;
  }
  const result = weights.reduce((sum, row, i) => sum + row[order] * evaluate(fn, [nodes[i]]), 0);
  const rounded = Math.round(result);
  return Math.abs(result - rounded) <= Math.max(1, Math.abs(result)) * 1e-7 ? rounded : result;
}

export function taylorSeries(derivatives, x, x0 = 0) {
  if (!Array.isArray(derivatives) || derivatives.length === 0 || derivatives.some(fn => typeof fn !== 'function')) {
    throw new TypeError('derivatives must be a non-empty array of callback functions');
  }
  finiteNumber(x, 'x');
  finiteNumber(x0, 'x0');
  const terms = [];
  let value = 0;
  let factorial = 1;
  const dx = x - x0;
  for (let order = 0; order < derivatives.length; order++) {
    if (order > 0) factorial *= order;
    const derivative = evaluate(derivatives[order], [x0], `derivative ${order}`);
    const term = derivative * dx ** order / factorial;
    value += term;
    terms.push({ order, derivative, factorial, term, partialSum: value });
  }
  return { value, terms, steps: terms, x, x0 };
}

function bracketSetup(fn, lower, upper, options) {
  callable(fn);
  finiteNumber(lower, 'lower bound');
  finiteNumber(upper, 'upper bound');
  if (lower >= upper) throw new RangeError('lower bound must be less than upper bound');
  const config = optionsOf(options);
  const fLower = evaluate(fn, [lower]);
  const fUpper = evaluate(fn, [upper]);
  if (Math.abs(fLower) > config.tolerance && Math.abs(fUpper) > config.tolerance && Math.sign(fLower) === Math.sign(fUpper)) {
    throw new RangeError('interval must bracket a root with opposite signs');
  }
  return { ...config, fLower, fUpper };
}

export function bisection(fn, lower, upper, options = {}) {
  const config = bracketSetup(fn, lower, upper, options);
  if (Math.abs(config.fLower) <= config.tolerance) return rootResult(lower, true, []);
  if (Math.abs(config.fUpper) <= config.tolerance) return rootResult(upper, true, []);
  let a = lower, b = upper, fa = config.fLower, root = a;
  const iterations = [];
  for (let iteration = 1; iteration <= config.maxIterations; iteration++) {
    root = (a + b) / 2;
    const value = evaluate(fn, [root]);
    iterations.push({ iteration, lower: a, upper: b, root, value, error: Math.abs(b - a) / 2 });
    if (Math.abs(value) <= config.tolerance || Math.abs(b - a) / 2 <= config.tolerance) return rootResult(root, true, iterations);
    if (Math.sign(fa) === Math.sign(value)) { a = root; fa = value; } else b = root;
  }
  return rootResult(root, false, iterations);
}

export function regulaFalsi(fn, lower, upper, options = {}) {
  const config = bracketSetup(fn, lower, upper, options);
  if (Math.abs(config.fLower) <= config.tolerance) return rootResult(lower, true, []);
  if (Math.abs(config.fUpper) <= config.tolerance) return rootResult(upper, true, []);
  let a = lower, b = upper, fa = config.fLower, fb = config.fUpper, root = a, previous = null;
  const iterations = [];
  for (let iteration = 1; iteration <= config.maxIterations; iteration++) {
    const denominator = fb - fa;
    if (Math.abs(denominator) <= Number.EPSILON) throw new RangeError('regula falsi denominator is zero');
    root = (a * fb - b * fa) / denominator;
    const value = evaluate(fn, [root]);
    const error = previous === null ? Math.abs(b - a) : Math.abs(root - previous);
    iterations.push({ iteration, lower: a, upper: b, root, value, error });
    if (Math.abs(value) <= config.tolerance || (previous !== null && error <= config.tolerance)) return rootResult(root, true, iterations);
    if (Math.sign(fa) === Math.sign(value)) { a = root; fa = value; } else { b = root; fb = value; }
    previous = root;
  }
  return rootResult(root, false, iterations);
}

function rootResult(root, converged, iterations) {
  return { root, value: root, converged, iterations, steps: iterations };
}

export function fixedPoint(transform, initial, options = {}) {
  callable(transform, 'transform');
  finiteNumber(initial, 'initial value');
  const config = optionsOf(options);
  let current = initial;
  const iterations = [];
  for (let iteration = 1; iteration <= config.maxIterations; iteration++) {
    const next = evaluate(transform, [current], 'transform result');
    const error = Math.abs(next - current);
    iterations.push({ iteration, current, next, error });
    current = next;
    if (error <= config.tolerance) return rootResult(current, true, iterations);
  }
  return rootResult(current, false, iterations);
}

export function newton(fn, derivative, initial, options = {}) {
  callable(fn);
  callable(derivative, 'derivative');
  finiteNumber(initial, 'initial value');
  const config = optionsOf(options);
  let current = initial;
  const iterations = [];
  for (let iteration = 1; iteration <= config.maxIterations; iteration++) {
    const value = evaluate(fn, [current]);
    if (Math.abs(value) <= config.tolerance) return rootResult(current, true, iterations);
    const slope = evaluate(derivative, [current], 'derivative result');
    if (Math.abs(slope) <= EPS) throw new RangeError('derivative is zero');
    const next = current - value / slope;
    finiteNumber(next, 'Newton iterate');
    const error = Math.abs(next - current);
    iterations.push({ iteration, current, functionValue: value, derivative: slope, next, error });
    current = next;
    if (error <= config.tolerance) return rootResult(current, true, iterations);
  }
  return rootResult(current, false, iterations);
}

export function secant(fn, first, second, options = {}) {
  callable(fn);
  finiteNumber(first, 'first initial value');
  finiteNumber(second, 'second initial value');
  if (first === second) throw new RangeError('initial values must be distinct');
  const config = optionsOf(options);
  let previous = first, current = second;
  let fPrevious = evaluate(fn, [previous]), fCurrent = evaluate(fn, [current]);
  const iterations = [];
  for (let iteration = 1; iteration <= config.maxIterations; iteration++) {
    if (Math.abs(fCurrent) <= config.tolerance) return rootResult(current, true, iterations);
    const denominator = fCurrent - fPrevious;
    if (Math.abs(denominator) <= EPS) throw new RangeError('secant denominator is zero');
    const next = current - fCurrent * (current - previous) / denominator;
    finiteNumber(next, 'secant iterate');
    const error = Math.abs(next - current);
    iterations.push({ iteration, previous, current, next, functionValue: fCurrent, error });
    previous = current; fPrevious = fCurrent; current = next; fCurrent = evaluate(fn, [current]);
    if (error <= config.tolerance || Math.abs(fCurrent) <= config.tolerance) return rootResult(current, true, iterations);
  }
  return rootResult(current, false, iterations);
}

function matrixCopy(matrix, name = 'matrix') {
  if (!Array.isArray(matrix) || matrix.length === 0 || matrix.some(row => !Array.isArray(row) || row.length !== matrix.length)) {
    throw new TypeError(`${name} must be a non-empty square matrix`);
  }
  return matrix.map((row, i) => row.map((value, j) => finiteNumber(value, `${name}[${i}][${j}]`)));
}

function linearSystem(matrix, vector) {
  const A = matrixCopy(matrix);
  if (!Array.isArray(vector) || vector.length !== A.length) throw new TypeError('vector length must match square matrix size');
  const b = vector.map((value, i) => finiteNumber(value, `vector[${i}]`));
  return { A, b, n: A.length };
}

function pivotRow(A, column) {
  let pivot = column;
  for (let row = column + 1; row < A.length; row++) if (Math.abs(A[row][column]) > Math.abs(A[pivot][column])) pivot = row;
  if (Math.abs(A[pivot][column]) <= EPS) throw new RangeError('matrix is singular');
  return pivot;
}

export function gaussianElimination(matrix, vector) {
  const { A, b, n } = linearSystem(matrix, vector);
  const steps = [];
  for (let column = 0; column < n; column++) {
    const pivot = pivotRow(A, column);
    if (pivot !== column) { [A[column], A[pivot]] = [A[pivot], A[column]]; [b[column], b[pivot]] = [b[pivot], b[column]]; steps.push({ operation: 'swap', rows: [column, pivot], matrix: A.map(r => [...r]), vector: [...b] }); }
    for (let row = column + 1; row < n; row++) {
      const factor = A[row][column] / A[column][column];
      for (let j = column; j < n; j++) A[row][j] -= factor * A[column][j];
      b[row] -= factor * b[column];
      steps.push({ operation: 'eliminate', pivotRow: column, row, factor, matrix: A.map(r => [...r]), vector: [...b] });
    }
  }
  const solution = Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = b[row];
    for (let j = row + 1; j < n; j++) sum -= A[row][j] * solution[j];
    if (Math.abs(A[row][row]) <= EPS) throw new RangeError('matrix is singular');
    solution[row] = sum / A[row][row];
    finiteNumber(solution[row], 'solution');
    steps.push({ operation: 'back-substitute', row, value: solution[row] });
  }
  return { solution, upper: A, transformedVector: b, steps };
}

export function gaussJordan(matrix, vector) {
  const { A, b, n } = linearSystem(matrix, vector);
  const steps = [];
  for (let column = 0; column < n; column++) {
    const pivot = pivotRow(A, column);
    if (pivot !== column) { [A[column], A[pivot]] = [A[pivot], A[column]]; [b[column], b[pivot]] = [b[pivot], b[column]]; steps.push({ operation: 'swap', rows: [column, pivot] }); }
    const divisor = A[column][column];
    for (let j = 0; j < n; j++) A[column][j] /= divisor;
    b[column] /= divisor;
    steps.push({ operation: 'normalize', row: column, divisor, matrix: A.map(r => [...r]), vector: [...b] });
    for (let row = 0; row < n; row++) if (row !== column) {
      const factor = A[row][column];
      for (let j = 0; j < n; j++) A[row][j] -= factor * A[column][j];
      b[row] -= factor * b[column];
      steps.push({ operation: 'eliminate', pivotRow: column, row, factor, matrix: A.map(r => [...r]), vector: [...b] });
    }
  }
  return { solution: b, reducedMatrix: A, steps };
}

export function luDecomposition(matrix) {
  const U = matrixCopy(matrix);
  const n = U.length;
  const L = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0));
  const P = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0));
  const steps = [];
  for (let column = 0; column < n; column++) {
    const pivot = pivotRow(U, column);
    if (pivot !== column) {
      [U[column], U[pivot]] = [U[pivot], U[column]];
      [P[column], P[pivot]] = [P[pivot], P[column]];
      for (let j = 0; j < column; j++) [L[column][j], L[pivot][j]] = [L[pivot][j], L[column][j]];
      steps.push({ operation: 'swap', rows: [column, pivot] });
    }
    for (let row = column + 1; row < n; row++) {
      const factor = U[row][column] / U[column][column];
      L[row][column] = factor;
      for (let j = column; j < n; j++) U[row][j] -= factor * U[column][j];
      steps.push({ operation: 'eliminate', pivotRow: column, row, factor, L: L.map(r => [...r]), U: U.map(r => [...r]) });
    }
  }
  return { L, U, P, steps };
}

function iterativeSystem(matrix, vector, options) {
  const system = linearSystem(matrix, vector);
  const config = optionsOf(options);
  const initial = options.initial ?? Array(system.n).fill(0);
  if (!Array.isArray(initial) || initial.length !== system.n) throw new TypeError('initial vector length must match matrix size');
  const guess = initial.map((v, i) => finiteNumber(v, `initial[${i}]`));
  for (let i = 0; i < system.n; i++) if (Math.abs(system.A[i][i]) <= EPS) throw new RangeError('matrix diagonal entries must be nonzero');
  return { ...system, ...config, guess };
}

function iterativeResult(solution, converged, iterations) {
  return { solution, converged, iterations, steps: iterations };
}

export function jacobi(matrix, vector, options = {}) {
  const { A, b, n, tolerance, maxIterations, guess } = iterativeSystem(matrix, vector, options);
  let current = guess;
  const iterations = [];
  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const next = Array(n);
    for (let i = 0; i < n; i++) {
      let sum = b[i];
      for (let j = 0; j < n; j++) if (j !== i) sum -= A[i][j] * current[j];
      next[i] = sum / A[i][i];
      finiteNumber(next[i], 'Jacobi iterate');
    }
    const error = Math.max(...next.map((v, i) => Math.abs(v - current[i])));
    iterations.push({ iteration, values: [...next], error });
    current = next;
    if (error <= tolerance) return iterativeResult(current, true, iterations);
  }
  return iterativeResult(current, false, iterations);
}

export function gaussSeidel(matrix, vector, options = {}) {
  const { A, b, n, tolerance, maxIterations, guess } = iterativeSystem(matrix, vector, options);
  let current = guess;
  const iterations = [];
  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const previous = [...current];
    for (let i = 0; i < n; i++) {
      let sum = b[i];
      for (let j = 0; j < n; j++) if (j !== i) sum -= A[i][j] * current[j];
      current[i] = sum / A[i][i];
      finiteNumber(current[i], 'Gauss-Seidel iterate');
    }
    const error = Math.max(...current.map((v, i) => Math.abs(v - previous[i])));
    iterations.push({ iteration, values: [...current], error });
    if (error <= tolerance) return iterativeResult(current, true, iterations);
  }
  return iterativeResult(current, false, iterations);
}

function checkedPoints(points, minimum = 2) {
  if (!Array.isArray(points) || points.length < minimum) throw new TypeError(`points must contain at least ${minimum} [x, y] pairs`);
  const result = points.map((point, i) => {
    if (!Array.isArray(point) || point.length !== 2) throw new TypeError(`point ${i} must be an [x, y] pair`);
    return [finiteNumber(point[0], `point ${i} x`), finiteNumber(point[1], `point ${i} y`)];
  });
  if (new Set(result.map(point => point[0])).size !== result.length) throw new RangeError('point x values must be distinct; duplicate found');
  return result;
}

export function lagrange(points, x) {
  const data = checkedPoints(points);
  finiteNumber(x, 'x');
  let value = 0;
  const steps = data.map(([xi, yi], i) => {
    let basis = 1;
    const factors = [];
    data.forEach(([xj], j) => { if (j !== i) { const factor = (x - xj) / (xi - xj); basis *= factor; factors.push({ j, factor }); } });
    const contribution = yi * basis;
    value += contribution;
    return { i, basis, contribution, factors, partialSum: value };
  });
  return { value, steps };
}

export function newtonInterpolation(points, x) {
  const data = checkedPoints(points);
  finiteNumber(x, 'x');
  const n = data.length;
  const table = Array.from({ length: n }, () => Array(n).fill(null));
  data.forEach((point, i) => { table[i][0] = point[1]; });
  for (let order = 1; order < n; order++) for (let i = 0; i < n - order; i++) table[i][order] = (table[i + 1][order - 1] - table[i][order - 1]) / (data[i + order][0] - data[i][0]);
  let value = table[0][0], product = 1;
  const steps = [{ order: 0, coefficient: table[0][0], product: 1, term: table[0][0], partialSum: value }];
  for (let order = 1; order < n; order++) {
    product *= x - data[order - 1][0];
    const term = table[0][order] * product;
    value += term;
    steps.push({ order, coefficient: table[0][order], product, term, partialSum: value });
  }
  return { value, coefficients: table[0], table, steps };
}

export function linearRegression(points) {
  const data = checkedPoints(points);
  const n = data.length;
  const meanX = data.reduce((s, p) => s + p[0], 0) / n;
  const meanY = data.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  const steps = data.map(([x, y]) => {
    const dx = x - meanX, dy = y - meanY;
    sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
    return { x, y, dx, dy, dx2: dx * dx, dxdy: dx * dy };
  });
  if (Math.abs(sxx) <= EPS) throw new RangeError('x values must have nonzero variance and be distinct');
  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const residuals = data.map(([x, y]) => ({ x, y, predicted: intercept + slope * x, residual: y - intercept - slope * x }));
  const sse = residuals.reduce((sum, row) => sum + row.residual ** 2, 0);
  const r2 = syy <= EPS ? (sse <= EPS ? 1 : 0) : 1 - sse / syy;
  return { slope, intercept, r2, meanX, meanY, residuals, predict: x => intercept + slope * finiteNumber(x, 'x'), steps };
}

export function finiteDifference(fn, x, step = 1e-5, method = 'central') {
  callable(fn);
  finiteNumber(x, 'x');
  finiteNumber(step, 'step');
  if (step <= 0) throw new RangeError('step must be positive');
  const samples = [];
  const sample = at => { const value = evaluate(fn, [at]); samples.push({ x: at, value }); return value; };
  let value;
  if (method === 'forward') value = (sample(x + step) - sample(x)) / step;
  else if (method === 'backward') value = (sample(x) - sample(x - step)) / step;
  else if (method === 'central') value = (sample(x + step) - sample(x - step)) / (2 * step);
  else if (method === 'second') value = (sample(x + step) - 2 * sample(x) + sample(x - step)) / step ** 2;
  else throw new RangeError('method must be forward, backward, central, or second');
  finiteNumber(value, 'finite difference');
  return { value, method, x, step, samples, steps: samples };
}

function quadratureSetup(fn, a, b, subintervals) {
  callable(fn);
  finiteNumber(a, 'lower bound');
  finiteNumber(b, 'upper bound');
  if (a === b) throw new RangeError('integration interval must have nonzero length');
  positiveInteger(subintervals, 'subinterval count');
}

export function trapezoid(fn, a, b, subintervals = 1) {
  quadratureSetup(fn, a, b, subintervals);
  const h = (b - a) / subintervals;
  const steps = [];
  let weightedSum = 0;
  for (let i = 0; i <= subintervals; i++) {
    const x = a + i * h, fx = evaluate(fn, [x]), weight = i === 0 || i === subintervals ? 1 : 2;
    weightedSum += weight * fx;
    steps.push({ i, x, fx, weight, contribution: weight * fx });
  }
  return { value: h * weightedSum / 2, stepSize: h, steps, samples: steps };
}

export function simpson13(fn, a, b, subintervals = 2) {
  quadratureSetup(fn, a, b, subintervals);
  if (subintervals % 2 !== 0) throw new RangeError('Simpson 1/3 requires an even subinterval count');
  const h = (b - a) / subintervals;
  const steps = [];
  let weightedSum = 0;
  for (let i = 0; i <= subintervals; i++) {
    const x = a + i * h, fx = evaluate(fn, [x]), weight = i === 0 || i === subintervals ? 1 : i % 2 ? 4 : 2;
    weightedSum += weight * fx; steps.push({ i, x, fx, weight, contribution: weight * fx });
  }
  return { value: h * weightedSum / 3, stepSize: h, steps, samples: steps };
}

export function simpson38(fn, a, b, subintervals = 3) {
  quadratureSetup(fn, a, b, subintervals);
  if (subintervals % 3 !== 0) throw new RangeError('Simpson 3/8 requires a subinterval count that is a multiple of 3');
  const h = (b - a) / subintervals;
  const steps = [];
  let weightedSum = 0;
  for (let i = 0; i <= subintervals; i++) {
    const x = a + i * h, fx = evaluate(fn, [x]);
    const weight = i === 0 || i === subintervals ? 1 : i % 3 === 0 ? 2 : 3;
    weightedSum += weight * fx; steps.push({ i, x, fx, weight, contribution: weight * fx });
  }
  return { value: 3 * h * weightedSum / 8, stepSize: h, steps, samples: steps };
}

const GAUSS_RULES = {
  2: { nodes: [-0.5773502691896257, 0.5773502691896257], weights: [1, 1] },
  3: { nodes: [-0.7745966692414834, 0, 0.7745966692414834], weights: [5 / 9, 8 / 9, 5 / 9] },
  4: { nodes: [-0.8611363115940526, -0.3399810435848563, 0.3399810435848563, 0.8611363115940526], weights: [0.3478548451374538, 0.6521451548625461, 0.6521451548625461, 0.3478548451374538] },
  5: { nodes: [-0.906179845938664, -0.5384693101056831, 0, 0.5384693101056831, 0.906179845938664], weights: [0.2369268850561891, 0.4786286704993665, 0.5688888888888889, 0.4786286704993665, 0.2369268850561891] },
};

export function gaussLegendre(fn, a, b, order = 2) {
  callable(fn); finiteNumber(a, 'lower bound'); finiteNumber(b, 'upper bound');
  if (a === b) throw new RangeError('integration interval must have nonzero length');
  if (!GAUSS_RULES[order]) throw new RangeError('Gauss-Legendre order must be 2, 3, 4, or 5');
  const midpoint = (a + b) / 2, scale = (b - a) / 2, rule = GAUSS_RULES[order];
  const steps = rule.nodes.map((node, i) => {
    const x = midpoint + scale * node, fx = evaluate(fn, [x]), weight = rule.weights[i];
    return { i, node, x, fx, weight, contribution: scale * weight * fx };
  });
  return { value: steps.reduce((sum, row) => sum + row.contribution, 0), order, steps, samples: steps };
}

function odeSolve(method, fn, x0, y0, target, step) {
  callable(fn); finiteNumber(x0, 'initial x'); finiteNumber(y0, 'initial y'); finiteNumber(target, 'target x'); finiteNumber(step, 'step');
  if (step <= 0) throw new RangeError('step must be positive');
  let x = x0, y = y0;
  const points = [{ x, y }], steps = [];
  const direction = Math.sign(target - x0);
  if (direction === 0) return { x, y, value: y, points, steps };
  const maxSteps = Math.ceil(Math.abs(target - x0) / step) + 1;
  for (let iteration = 1; iteration <= maxSteps && direction * (target - x) > EPS; iteration++) {
    const h = direction * Math.min(step, Math.abs(target - x));
    const k1 = evaluate(fn, [x, y], 'ODE derivative');
    let nextY, detail;
    if (method === 'euler') {
      nextY = y + h * k1; detail = { k1 };
    } else if (method === 'heun') {
      const predictor = y + h * k1;
      const k2 = evaluate(fn, [x + h, predictor], 'ODE derivative');
      nextY = y + h * (k1 + k2) / 2; detail = { k1, predictor, k2 };
    } else {
      const k2 = evaluate(fn, [x + h / 2, y + h * k1 / 2], 'ODE derivative');
      const k3 = evaluate(fn, [x + h / 2, y + h * k2 / 2], 'ODE derivative');
      const k4 = evaluate(fn, [x + h, y + h * k3], 'ODE derivative');
      nextY = y + h * (k1 + 2 * k2 + 2 * k3 + k4) / 6; detail = { k1, k2, k3, k4 };
    }
    finiteNumber(nextY, 'ODE solution');
    const nextX = Math.abs(target - (x + h)) <= EPS ? target : x + h;
    steps.push({ iteration, x, y, h, ...detail, nextX, nextY });
    x = nextX; y = nextY; points.push({ x, y });
  }
  return { x, y, value: y, points, steps };
}

export function euler(fn, x0, y0, target, step) { return odeSolve('euler', fn, x0, y0, target, step); }
export function heun(fn, x0, y0, target, step) { return odeSolve('heun', fn, x0, y0, target, step); }
export function rk4(fn, x0, y0, target, step) { return odeSolve('rk4', fn, x0, y0, target, step); }
