export function oddSquareSum(n) {
  if (!Number.isInteger(n) || n < 1) throw new RangeError("n harus bilangan asli");
  return n * (4 * n * n - 1) / 3;
}

export function inductionStep(k) {
  if (!Number.isInteger(k) || k < 1) throw new RangeError("k harus bilangan asli");
  const previous = oddSquareSum(k);
  const nextTerm = (2 * k + 1) ** 2;
  const combined = previous + nextTerm;
  return { previous, nextTerm, combined, target: oddSquareSum(k + 1) };
}
