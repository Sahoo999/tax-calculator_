/**
 * Golden-case tests for tax engine. Run: node js/tax-engine.test.js
 */
import {
  calculateSlabTax,
  applyRebate87A,
  calculateHRAExemption,
  compareRegimes,
  calculateRegimeTax,
  normalizeInputs,
} from "./tax-engine.js";
import { NEW_REGIME_SLABS, OLD_REGIME_SLABS } from "./tax-config.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

function approxEqual(a, b, tol = 1) {
  return Math.abs(a - b) <= tol;
}

console.log("1. New regime slabs");
{
  const { tax } = calculateSlabTax(1200000, NEW_REGIME_SLABS);
  // 4L@0 + 4L@5% = 20k + 4L@10% = 40k → 60k
  assert(approxEqual(tax, 60000), `Tax on 12L taxable = 60k (got ${tax})`);
}

console.log("2. Old regime below 60");
{
  const { tax } = calculateSlabTax(1000000, OLD_REGIME_SLABS.below60);
  // 2.5L@0 + 2.5L@5%=12500 + 5L@20%=1L → 112500
  assert(approxEqual(tax, 112500), `Tax on 10L = 1,12,500 (got ${tax})`);
}

console.log("3. Senior old regime exemption 3L");
{
  const { tax } = calculateSlabTax(300000, OLD_REGIME_SLABS.senior);
  assert(approxEqual(tax, 0), `Senior 3L tax = 0 (got ${tax})`);
}

console.log("4. Super senior exemption 5L");
{
  const { tax } = calculateSlabTax(500000, OLD_REGIME_SLABS.superSenior);
  assert(approxEqual(tax, 0), `Super senior 5L tax = 0 (got ${tax})`);
}

console.log("5. 87A new — full rebate at 12L");
{
  const r = applyRebate87A({
    taxOnNormalIncome: 60000,
    totalIncomeForRebate: 1200000,
    regime: "new",
    isResident: true,
  });
  assert(approxEqual(r.rebate, 60000), `Rebate 60k (got ${r.rebate})`);
  assert(approxEqual(r.taxAfterRebate, 0), `Tax after rebate 0`);
}

console.log("6. 87A new — not for NRI");
{
  const r = applyRebate87A({
    taxOnNormalIncome: 60000,
    totalIncomeForRebate: 1200000,
    regime: "new",
    isResident: false,
  });
  assert(approxEqual(r.rebate, 0), `NRI rebate 0`);
}

console.log("7. 87A old");
{
  const r = applyRebate87A({
    taxOnNormalIncome: 12500,
    totalIncomeForRebate: 500000,
    regime: "old",
    isResident: true,
  });
  assert(approxEqual(r.rebate, 12500), `Old rebate 12,500`);
}

console.log("8. 87A marginal relief above 12L");
{
  const income = 1210000;
  const { tax } = calculateSlabTax(income, NEW_REGIME_SLABS);
  const r = applyRebate87A({
    taxOnNormalIncome: tax,
    totalIncomeForRebate: income,
    regime: "new",
    isResident: true,
  });
  assert(
    approxEqual(r.taxAfterRebate, 10000),
    `Marginal relief tax = 10k excess (got ${r.taxAfterRebate}, slab ${tax})`
  );
}

console.log("9. HRA exemption");
{
  const hra = calculateHRAExemption({
    basicDA: 600000,
    hraReceived: 300000,
    rentPaid: 360000,
    isMetro: true,
  });
  // min(300000, 360000-60000=300000, 50%*600000=300000) = 300000
  assert(approxEqual(hra, 300000), `HRA metro = 3L (got ${hra})`);
}

console.log("10. Golden: salary 12.75L new regime → zero tax");
{
  const result = compareRegimes({
    mode: "quick",
    quickIncome: 1275000,
    quickHasSalary: true,
    ageCategory: "below60",
    residentialStatus: "resident",
    incomeType: "salaried",
    quickOldDeductions: 0,
  });
  assert(
    approxEqual(result.new.totalTax, 0),
    `12.75L salaried new tax = 0 (got ${result.new.totalTax})`
  );
  assert(
    approxEqual(result.new.stdDeduction, 75000),
    `Std deduction 75k`
  );
}

console.log("11. Cess applied at 4%");
{
  const result = calculateRegimeTax(
    normalizeInputs({
      mode: "quick",
      quickIncome: 2000000,
      quickHasSalary: true,
      ageCategory: "below60",
      residentialStatus: "resident",
      incomeType: "salaried",
    }),
    "new"
  );
  const expectedCess = (result.taxAfterRebate + result.surcharge) * 0.04;
  assert(
    approxEqual(result.cess, expectedCess, 0.5),
    `Cess 4% (got ${result.cess}, expected ${expectedCess})`
  );
  assert(result.totalTax > result.taxAfterRebate, "Total includes cess");
}

console.log("12. Std deduction only for salary-like");
{
  const biz = calculateRegimeTax(
    normalizeInputs({
      mode: "quick",
      quickIncome: 1000000,
      quickHasSalary: false,
      incomeType: "business",
      ageCategory: "below60",
      residentialStatus: "resident",
    }),
    "new"
  );
  assert(approxEqual(biz.stdDeduction, 0), `Business std ded = 0`);
}

console.log("13. Surcharge at 1.01 crore — gross 15% with marginal relief");
{
  const result = calculateRegimeTax(
    normalizeInputs({
      mode: "quick",
      quickIncome: 10100000,
      quickHasSalary: true,
      ageCategory: "below60",
      residentialStatus: "resident",
      incomeType: "salaried",
    }),
    "new"
  );
  assert(
    approxEqual(result.taxableNormal, 10025000),
    `Taxable 1,00,25,000 (got ${result.taxableNormal})`
  );
  assert(
    approxEqual(result.taxAfterRebate, 2587500),
    `Tax 25,87,500 (got ${result.taxAfterRebate})`
  );
  assert(
    approxEqual(result.surchargeBeforeRelief, 388125),
    `Gross surcharge 15% = 3,88,125 (got ${result.surchargeBeforeRelief})`
  );
  assert(
    approxEqual(result.surchargeMarginalRelief, 112625),
    `Marginal relief 1,12,625 (got ${result.surchargeMarginalRelief})`
  );
  assert(
    approxEqual(result.surcharge, 275500),
    `Net surcharge 2,75,500 (got ${result.surcharge})`
  );
  assert(
    approxEqual(
      result.taxAfterRebate + result.surcharge,
      2863000
    ),
    `Tax + net surcharge = 28,63,000`
  );
}

console.log("14. Surcharge at 55 lakh — no marginal relief");
{
  const result = calculateRegimeTax(
    normalizeInputs({
      mode: "quick",
      quickIncome: 5500000,
      quickHasSalary: true,
      ageCategory: "below60",
      residentialStatus: "resident",
      incomeType: "salaried",
    }),
    "new"
  );
  assert(
    approxEqual(result.surchargeBeforeRelief, result.surcharge),
    `No relief above 55L band`
  );
  assert(approxEqual(result.surchargeMarginalRelief, 0), `Marginal relief 0`);
}

console.log("\n─────────────────────");
console.log(`Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
