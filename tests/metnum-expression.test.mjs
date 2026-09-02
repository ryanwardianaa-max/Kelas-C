import test from 'node:test';
import assert from 'node:assert/strict';
import { compileExpression } from '../public/tools/lab-metode-numerik/expression.js';

test('evaluates documented arithmetic and functions safely', () => {
  assert.equal(compileExpression('x^2-2')(3), 7);
  assert.equal(compileExpression('sin(pi/2)')(0), 1);
  assert.equal(compileExpression('-2^2')(0), -4); // Unary minus applies after exponentiation.
  assert.equal(compileExpression('2^-2')(0), 0.25);
  assert.equal(compileExpression('x+y')(2, 3), 5);
  assert.equal(compileExpression('1,5 + .5')(0), 2);
  assert.equal(compileExpression('cos(0)+tan(0)+asin(0)+acos(1)+atan(0)')(0), 1);
  assert.equal(compileExpression('exp(0)+log(e)+ln(e)+sqrt(4)+abs(-3)')(0), 8);
});

test('rejects implicit multiplication with Indonesian error', () => {
  assert.throws(() => compileExpression('2x'), /perkalian implisit.*tidak didukung/i);
  assert.throws(() => compileExpression('2(x+1)'), /perkalian implisit.*tidak didukung/i);
  assert.throws(() => compileExpression('(x+1)(x-1)'), /perkalian implisit.*tidak didukung/i);
});

test('rejects unknown identifiers and malformed expressions', () => {
  for (const source of ['foo(x)', '1+', '(x', 'sin()', '', '2..3', '1,2,3']) {
    assert.throws(() => compileExpression(source), Error, source);
  }
});

test('rejects malicious syntax', () => {
  for (const source of [
    'globalThis.process.exit()',
    'x.constructor',
    'x=1',
    'x+=1',
    '1;2',
    'Function("return 1")()',
    'Math.sin(x)',
  ]) assert.throws(() => compileExpression(source), Error, source);
});

test('rejects non-finite inputs and results', () => {
  const identity = compileExpression('x');
  assert.throws(() => identity(Infinity), /hingga|finite/i);
  assert.throws(() => compileExpression('1/0')(0), /hingga|finite/i);
  assert.throws(() => compileExpression('sqrt(-1)')(0), /hingga|finite/i);
});
