import assert from "node:assert/strict";
import {
  calculateBusiness,
  calculatePercentageScenario,
  calculateConsumption,
  calculateNonLinearMarket,
  calculatePPF,
} from "../public/tools/kalkulator-mateko/core.js";

const kg = calculateBusiness({ fixedCost: 102500, price: 4500, variableCost: 4000, quantity: 205 });
assert.equal(kg.bepExact, 205);
assert.equal(kg.profit, 0);

const initial = calculatePercentageScenario({ fixedCost: 30000, price: 50, variablePercent: 40, quantity: 10000 });
assert.equal(initial.v, 20);
assert.equal(initial.bepExact, 1000);
assert.equal(initial.profit, 270000);

const raised = calculatePercentageScenario({ fixedCost: 30000, price: 75, variablePercent: 40, quantity: 10000 });
assert.equal(raised.v, 30);
assert.ok(Math.abs(raised.bepExact - 2000 / 3) < 1e-9);
assert.equal(raised.bepSafe, 667);
assert.equal(raised.profit, 420000);

const direct = calculateConsumption({ autonomousConsumption: "4,5", mpc: "0,9", disposableIncome: 15000000, scale: 1 });
assert.equal(direct.consumption, 13500004.5);
assert.equal(direct.saving, 1499995.5);
assert.equal(direct.consumption + direct.saving, direct.yd);

const millions = calculateConsumption({ autonomousConsumption: "4,5", mpc: "0,9", disposableIncome: 15000000, scale: 1000000 });
assert.equal(millions.consumption, 18000000);
assert.equal(millions.saving, -3000000);
assert.throws(() => calculateBusiness({ fixedCost: 1, price: 5, variableCost: 5, quantity: 2 }), /lebih besar/);
assert.throws(() => calculateConsumption({ autonomousConsumption: 1, mpc: 1.1, disposableIncome: 1 }), /MPC/);

// Tests for Pertemuan 05: Non-linear market & PPF
const nl1 = calculateNonLinearMarket({ demand: "P = 25 - Q^2", supply: "P = 2Q + 1" });
assert.equal(nl1.q, 4);
assert.equal(nl1.p, 9);

const nl2 = calculateNonLinearMarket({ demand: "P = 25 - Q^2", supply: "P = 2Q + 1", tax: 4 });
assert.ok(Math.abs(nl2.q - 3.582575) < 1e-4);
assert.ok(Math.abs(nl2.p - 12.165151) < 1e-4);
assert.ok(Math.abs(nl2.totalTax - 4 * nl2.q) < 1e-6);

const nl3 = calculateNonLinearMarket({ demand: "Q = 64 - P^2", supply: "Q = P^2 - 8" });
assert.equal(nl3.q, 28);
assert.equal(nl3.p, 6);

const ppf1 = calculatePPF({ a: 2, b: 1, c: 72, x: 4 });
assert.equal(ppf1.maxX, 6);
assert.ok(Math.abs(ppf1.y - Math.sqrt(40)) < 1e-6);

const ppf2 = calculatePPF({ a: 1, b: 4, c: 100, x: 6 });
assert.equal(ppf2.maxX, 10);
assert.equal(ppf2.maxY, 5);
assert.equal(ppf2.y, 4);

assert.throws(() => calculatePPF({ a: 2, b: 1, c: 72, x: 10 }), /melebihi/);

console.log("kalkulator mateko: OK");
