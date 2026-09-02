const FUNCTIONS = Object.freeze({
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  exp: Math.exp,
  log: Math.log,
  ln: Math.log,
  sqrt: Math.sqrt,
  abs: Math.abs,
});

const CONSTANTS = Object.freeze({ pi: Math.PI, e: Math.E });

function tokenize(source) {
  const tokens = [];
  let i = 0;

  while (i < source.length) {
    const rest = source.slice(i);
    const whitespace = rest.match(/^\s+/);
    if (whitespace) {
      i += whitespace[0].length;
      continue;
    }

    const number = rest.match(/^(?:\d+(?:[.,]\d*)?|[.,]\d+)/);
    if (number) {
      const text = number[0];
      const value = Number(text.replace(',', '.'));
      if (!Number.isFinite(value)) throw new Error('Angka harus bernilai hingga.');
      tokens.push({ type: 'number', value });
      i += text.length;
      continue;
    }

    const identifier = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifier) {
      tokens.push({ type: 'identifier', value: identifier[0] });
      i += identifier[0].length;
      continue;
    }

    const char = source[i];
    if ('+-*/^()'.includes(char)) {
      tokens.push({ type: char, value: char });
      i += 1;
      continue;
    }

    throw new Error(`Karakter tidak diizinkan: ${char}`);
  }

  tokens.push({ type: 'end' });
  return tokens;
}

export function compileExpression(source) {
  if (typeof source !== 'string' || source.trim() === '') {
    throw new Error('Ekspresi tidak boleh kosong.');
  }

  const tokens = tokenize(source);
  let position = 0;
  const peek = () => tokens[position];
  const take = (type) => {
    if (peek().type !== type) throw new Error('Ekspresi tidak valid.');
    return tokens[position++];
  };

  const parsePrimary = () => {
    const token = peek();
    if (token.type === 'number') {
      position += 1;
      return () => token.value;
    }

    if (token.type === 'identifier') {
      position += 1;
      const name = token.value;
      if (Object.hasOwn(CONSTANTS, name)) return () => CONSTANTS[name];
      if (name === 'x' || name === 'y') {
        const index = name === 'x' ? 0 : 1;
        return (variables) => variables[index];
      }
      if (!Object.hasOwn(FUNCTIONS, name)) {
        throw new Error(`Identifier tidak dikenal: ${name}`);
      }
      take('(');
      const argument = parseAdditive();
      take(')');
      return (variables) => FUNCTIONS[name](argument(variables));
    }

    if (token.type === '(') {
      position += 1;
      const expression = parseAdditive();
      take(')');
      return expression;
    }

    throw new Error('Ekspresi tidak valid.');
  };

  const parsePower = () => {
    const left = parsePrimary();
    if (peek().type !== '^') return left;
    position += 1;
    const right = parseUnary();
    return (variables) => left(variables) ** right(variables);
  };

  const parseUnary = () => {
    if (peek().type === '+') {
      position += 1;
      return parseUnary();
    }
    if (peek().type === '-') {
      position += 1;
      const operand = parseUnary();
      return (variables) => -operand(variables);
    }
    return parsePower();
  };

  const parseMultiplicative = () => {
    let left = parseUnary();
    while (peek().type === '*' || peek().type === '/' || peek().type === 'identifier' || peek().type === '(') {
      const operator = peek().type === '*' || peek().type === '/' ? tokens[position++].type : '*';
      const right = parseUnary();
      const previous = left;
      left = operator === '*'
        ? (variables) => previous(variables) * right(variables)
        : (variables) => previous(variables) / right(variables);
    }
    return left;
  };

  function parseAdditive() {
    let left = parseMultiplicative();
    while (peek().type === '+' || peek().type === '-') {
      const operator = tokens[position++].type;
      const right = parseMultiplicative();
      const previous = left;
      left = operator === '+'
        ? (variables) => previous(variables) + right(variables)
        : (variables) => previous(variables) - right(variables);
    }
    return left;
  }

  const evaluate = parseAdditive();
  if (peek().type !== 'end') {
    if (['number', 'identifier', '('].includes(peek().type)) {
      throw new Error('Perkalian implisit tidak didukung; gunakan tanda *.');
    }
    throw new Error('Ekspresi tidak valid.');
  }

  return (x, y) => {
    const variables = [x, y];
    for (const value of variables) {
      if (value !== undefined && !Number.isFinite(value)) {
        throw new Error('Nilai variabel harus bernilai hingga (finite).');
      }
    }
    const result = evaluate(variables);
    if (!Number.isFinite(result)) throw new Error('Hasil harus bernilai hingga (finite).');
    return result;
  };
}
