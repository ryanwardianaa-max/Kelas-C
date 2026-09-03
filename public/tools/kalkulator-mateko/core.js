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
