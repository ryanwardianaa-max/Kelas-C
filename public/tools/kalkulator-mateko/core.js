const number = (value, name) => {
  const n = Number(String(value).replaceAll(".", "").replace(",", "."));
  if (!Number.isFinite(n)) throw new Error(`${name} harus berupa angka.`);
  return n;
};

export function calculateBusiness({ fixedCost, price, variableCost, quantity }) {
  const fc = number(fixedCost, "Biaya tetap");
  const p = number(price, "Harga");
  const v = number(variableCost, "Biaya variabel");
  const q = number(quantity, "Jumlah produksi");
  if ([fc, p, v, q].some((x) => x < 0)) throw new Error("Nilai tidak boleh negatif.");
  if (p <= v) throw new Error("Harga harus lebih besar daripada biaya variabel agar BEP tercapai.");
  const contribution = p - v;
  const bepExact = fc / contribution;
  const totalRevenue = p * q;
  const totalCost = fc + v * q;
  return { fc, p, v, q, contribution, bepExact, bepSafe: Math.ceil(bepExact), totalRevenue, totalCost, profit: totalRevenue - totalCost };
}

export function calculatePercentageScenario({ fixedCost, price, variablePercent, quantity }) {
  const p = number(price, "Harga");
  const percent = number(variablePercent, "Persentase biaya variabel");
  if (percent < 0 || percent >= 100) throw new Error("Persentase biaya variabel harus 0 sampai kurang dari 100.");
  return calculateBusiness({ fixedCost, price: p, variableCost: p * percent / 100, quantity });
}

export function calculateConsumption({ autonomousConsumption, mpc, disposableIncome, scale = 1 }) {
  const a = number(autonomousConsumption, "Konsumsi otonom");
  const b = number(mpc, "MPC");
  const yd = number(disposableIncome, "Pendapatan disposibel");
  const multiplier = number(scale, "Skala konstanta");
  if (b < 0 || b > 1) throw new Error("MPC harus berada antara 0 dan 1.");
  if (yd < 0 || multiplier <= 0) throw new Error("Pendapatan tidak boleh negatif dan skala harus positif.");
  const constant = a * multiplier;
  const consumption = constant + b * yd;
  const saving = yd - consumption;
  return { a, b, yd, multiplier, constant, mps: 1 - b, consumption, saving, savingIntercept: -constant };
}

export function parsePoly(exprStr, v = "Q") {
  let s = String(exprStr).replace(/\s+/g, "").replace(/−/g, "-");
  s = s.replace(/-/g, "+-");
  if (s.startsWith("+")) s = s.slice(1);
  const terms = s.split("+").filter(Boolean);
  let a = 0, b = 0, c = 0;
  for (const t of terms) {
    if (t.includes(v + "^2") || t.includes(v + "²")) {
      const coeff = t.replace(v + "^2", "").replace(v + "²", "");
      if (coeff === "" || coeff === "+") a += 1;
      else if (coeff === "-") a -= 1;
      else a += Number(coeff.replace(",", "."));
    } else if (t.includes(v)) {
      const coeff = t.replace(v, "");
      if (coeff === "" || coeff === "+") b += 1;
      else if (coeff === "-") b -= 1;
      else b += Number(coeff.replace(",", "."));
    } else {
      c += Number(t.replace(",", "."));
    }
  }
  return { a, b, c };
}

export function calculateNonLinearMarket({ demand, supply, tax = 0, subsidy = 0 }) {
  const t = Number(String(tax).replace(",", ".")) || 0;
  const s = Number(String(subsidy).replace(",", ".")) || 0;
  if (t < 0 || s < 0) throw new Error("Pajak atau subsidi tidak boleh bernilai negatif.");

  let dClean = String(demand).replace(/Q_[dDsS]/g, "Q").replace(/P_[dDsS]/g, "P");
  let sClean = String(supply).replace(/Q_[dDsS]/g, "Q").replace(/P_[dDsS]/g, "P");

  const leftSide = dClean.includes("=") ? dClean.split("=")[0].trim() : "";
  const isPFunc = leftSide.toUpperCase().startsWith("P");
  const variable = isPFunc ? "Q" : "P";

  const dExpr = dClean.includes("=") ? dClean.split("=")[1] : dClean;
  const sExpr = sClean.includes("=") ? sClean.split("=")[1] : sClean;

  const D = parsePoly(dExpr, variable);
  const S = parsePoly(sExpr, variable);

  const netShift = t - s;
  const S_eff = { ...S };
  if (isPFunc) {
    S_eff.c += netShift;
  } else {
    S_eff.a = S.a;
    S_eff.b = S.b - 2 * S.a * netShift;
    S_eff.c = S.c + S.a * netShift * netShift - S.b * netShift;
  }

  const A = D.a - S_eff.a;
  const B = D.b - S_eff.b;
  const C = D.c - S_eff.c;

  let roots = [];
  if (Math.abs(A) < 1e-12) {
    if (Math.abs(B) < 1e-12) throw new Error("Kurva permintaan dan penawaran sejajar / tidak berpotongan.");
    roots.push(-C / B);
  } else {
    const disc = B * B - 4 * A * C;
    if (disc < 0) throw new Error("Diskriminan negatif (D < 0), kurva tidak saling berpotongan di bilangan real.");
    const sqrtD = Math.sqrt(disc);
    roots.push((-B + sqrtD) / (2 * A));
    roots.push((-B - sqrtD) / (2 * A));
  }

  const validRoots = roots.filter((r) => r > 0);
  if (!validRoots.length) throw new Error("Tidak ada perpotongan di kuadran positif (Q > 0, P > 0).");

  const varVal = validRoots[0];
  let q = 0, p = 0;
  if (isPFunc) {
    q = varVal;
    p = D.a * q * q + D.b * q + D.c;
  } else {
    p = varVal;
    q = D.a * p * p + D.b * p + D.c;
  }

  const totalTax = t > 0 ? t * q : 0;
  const totalSubsidy = s > 0 ? s * q : 0;

  return {
    q,
    p,
    variable,
    isPFunc,
    D,
    S,
    S_eff,
    A,
    B,
    C,
    roots,
    validRoots,
    tax: t,
    subsidy: s,
    totalTax,
    totalSubsidy,
  };
}

export function calculatePPF({ a, b, c, x, y }) {
  const coeffA = number(a, "Koefisien X²");
  const coeffB = number(b, "Koefisien Y²");
  const capC = number(c, "Kapasitas C");
  if (coeffA <= 0 || coeffB <= 0 || capC <= 0) throw new Error("Parameter a, b, dan c harus lebih besar dari 0.");

  const maxX = Math.sqrt(capC / coeffA);
  const maxY = Math.sqrt(capC / coeffB);

  let resX = x !== undefined && x !== "" && x !== null ? number(x, "Nilai X") : null;
  let resY = y !== undefined && y !== "" && y !== null ? number(y, "Nilai Y") : null;

  if (resX !== null) {
    const rem = capC - coeffA * resX * resX;
    if (rem < 0) throw new Error(`Target X = ${resX} melebihi batas maksimum kapasitas produksi (${maxX.toFixed(2)} unit).`);
    resY = Math.sqrt(rem / coeffB);
  } else if (resY !== null) {
    const rem = capC - coeffB * resY * resY;
    if (rem < 0) throw new Error(`Target Y = ${resY} melebihi batas maksimum kapasitas produksi (${maxY.toFixed(2)} unit).`);
    resX = Math.sqrt(rem / coeffA);
  }

  return { a: coeffA, b: coeffB, c: capC, maxX, maxY, x: resX, y: resY };
}
