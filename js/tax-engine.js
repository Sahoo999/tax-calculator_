import {
  CESS_RATE,
  STANDARD_DEDUCTION,
  REBATE_87A,
  NEW_REGIME_SLABS,
  OLD_REGIME_SLABS,
  SURCHARGE,
  LIMITS,
  METRO_CITIES,
} from "./tax-config.js";

export function formatINR(amount) {
  const n = Math.round(Number(amount) || 0);
  return n.toLocaleString("en-IN");
}

export function parseAmount(value) {
  const n = Number.parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Progressive slab tax with line-item breakdown */
export function calculateSlabTax(taxableIncome, slabs) {
  const income = Math.max(0, taxableIncome);
  let tax = 0;
  let prev = 0;
  const breakdown = [];

  for (const slab of slabs) {
    if (income <= prev) break;
    const upper = slab.upTo;
    const taxableInSlab = Math.min(income, upper) - prev;
    const taxInSlab = taxableInSlab * slab.rate;
    if (taxableInSlab > 0) {
      breakdown.push({
        from: prev,
        to: upper === Infinity ? null : upper,
        amount: taxableInSlab,
        rate: slab.rate,
        tax: taxInSlab,
      });
      tax += taxInSlab;
    }
    prev = upper;
  }

  return { tax, breakdown };
}

export function getOldRegimeSlabs(ageCategory, isResident) {
  if (!isResident) return OLD_REGIME_SLABS.below60;
  if (ageCategory === "superSenior") return OLD_REGIME_SLABS.superSenior;
  if (ageCategory === "senior") return OLD_REGIME_SLABS.senior;
  return OLD_REGIME_SLABS.below60;
}

/**
 * HRA exemption = min(
 *   actual HRA received,
 *   rent paid − 10% of Basic+DA,
 *   50% (metro) or 40% (non-metro) of Basic+DA
 * )
 */
export function calculateHRAExemption({
  basicDA,
  hraReceived,
  rentPaid,
  isMetro,
}) {
  const basic = Math.max(0, basicDA);
  const hra = Math.max(0, hraReceived);
  const rent = Math.max(0, rentPaid);
  if (hra <= 0 || rent <= 0 || basic <= 0) return 0;

  const a = hra;
  const b = Math.max(0, rent - 0.1 * basic);
  const c = (isMetro ? 0.5 : 0.4) * basic;
  return Math.min(a, b, c);
}

export function isMetroCity(cityName) {
  const key = String(cityName || "")
    .trim()
    .toLowerCase();
  return METRO_CITIES.includes(key) || key === "metro";
}

/** Section 80GG — rent paid without HRA (old regime) */
export function calculate80GG({ rentPaid, adjustedTotalIncome, months = 12 }) {
  const rent = Math.max(0, rentPaid);
  const ati = Math.max(0, adjustedTotalIncome);
  if (rent <= 0) return 0;
  const a = LIMITS.section80GGMonthly * months;
  const b = Math.max(0, rent - 0.1 * ati);
  const c = 0.25 * ati;
  return Math.min(a, b, c);
}

export function calculateFamilyPensionDeduction(familyPension, regime) {
  const fp = Math.max(0, familyPension);
  if (fp <= 0) return 0;
  const cap =
    regime === "new" ? LIMITS.familyPensionNew : LIMITS.familyPensionOld;
  return Math.min(fp / 3, cap);
}

export function calculate80D({
  selfPremium,
  parentsPremium,
  selfIsSenior,
  parentsAreSenior,
  includePreventive = true,
}) {
  const selfCap = selfIsSenior
    ? LIMITS.section80D.selfSenior
    : LIMITS.section80D.selfBelow60;
  const parentsCap = parentsAreSenior
    ? LIMITS.section80D.parentsSenior
    : LIMITS.section80D.parentsBelow60;

  let self = Math.min(Math.max(0, selfPremium), selfCap);
  let parents = Math.min(Math.max(0, parentsPremium), parentsCap);

  // Preventive checkup is within the overall 80D caps (not extra beyond max)
  if (!includePreventive) {
    /* amounts already capped */
  }

  return self + parents;
}

export function calculateLetOutHouseProperty({
  annualRent,
  municipalTax,
  interestPaid,
}) {
  const rent = Math.max(0, annualRent);
  const muni = Math.min(Math.max(0, municipalTax), rent);
  const nav = rent - muni;
  const standard30 = 0.3 * nav;
  const interest = Math.max(0, interestPaid);
  // Negative house property (loss) allowed; returned as signed income
  return nav - standard30 - interest;
}

/**
 * Section 87A rebate with marginal relief when income just exceeds limit.
 * Rebate applies only to tax on normal income (not special-rate income).
 * Marginal relief: tax payable should not exceed (income - limit) when
 * income is slightly above the rebate threshold.
 */
export function applyRebate87A({
  taxOnNormalIncome,
  totalIncomeForRebate,
  regime,
  isResident,
}) {
  if (!isResident || taxOnNormalIncome <= 0) {
    return { rebate: 0, taxAfterRebate: taxOnNormalIncome, marginalRelief: 0 };
  }

  const cfg = REBATE_87A[regime];
  const income = Math.max(0, totalIncomeForRebate);

  if (income <= cfg.incomeLimit) {
    const rebate = Math.min(taxOnNormalIncome, cfg.maxRebate);
    return {
      rebate,
      taxAfterRebate: taxOnNormalIncome - rebate,
      marginalRelief: 0,
    };
  }

  // Marginal relief: if tax > (income - limit), reduce tax to excess income
  const excess = income - cfg.incomeLimit;
  if (taxOnNormalIncome > excess) {
    const relievedTax = excess;
    const marginalRelief = taxOnNormalIncome - relievedTax;
    return {
      rebate: 0,
      taxAfterRebate: relievedTax,
      marginalRelief,
    };
  }

  return { rebate: 0, taxAfterRebate: taxOnNormalIncome, marginalRelief: 0 };
}

function getSurchargeRate(totalIncome, regime) {
  const brackets = SURCHARGE[regime];
  let rate = 0;
  for (const b of brackets) {
    if (totalIncome > b.above) rate = b.rate;
  }
  return rate;
}

/**
 * Surcharge with marginal relief at each threshold.
 * Marginal relief ensures tax + surcharge (excluding cess) does not exceed
 * tax + surcharge at the crossed threshold plus income above that threshold.
 */
export function applySurchargeWithRecalc({
  taxAfterRebate,
  totalIncome,
  regime,
  taxAtIncomeFn,
}) {
  const income = Math.max(0, totalIncome);
  const tax = Math.max(0, taxAfterRebate);
  const rate = getSurchargeRate(income, regime);

  if (rate === 0 || tax === 0) {
    return {
      surcharge: 0,
      surchargeBeforeRelief: 0,
      surchargeRate: 0,
      marginalRelief: 0,
    };
  }

  const surchargeBeforeRelief = tax * rate;
  let surcharge = surchargeBeforeRelief;
  let marginalRelief = 0;

  const thresholds =
    regime === "new"
      ? [5000000, 10000000, 20000000]
      : [5000000, 10000000, 20000000, 50000000];

  let crossed = null;
  for (const t of thresholds) {
    if (income > t) crossed = t;
  }

  if (crossed != null && typeof taxAtIncomeFn === "function") {
    const taxAtThreshold = taxAtIncomeFn(crossed);
    const rateAtThreshold = getSurchargeRate(crossed, regime);
    const taxPlusSurchargeAtThreshold =
      taxAtThreshold + taxAtThreshold * rateAtThreshold;
    const maxPayable = taxPlusSurchargeAtThreshold + (income - crossed);
    const taxPlusSurchargeActual = tax + surchargeBeforeRelief;

    if (taxPlusSurchargeActual > maxPayable) {
      marginalRelief = taxPlusSurchargeActual - maxPayable;
      surcharge = Math.max(0, maxPayable - tax);
    }
  }

  return { surcharge, surchargeBeforeRelief, surchargeRate: rate, marginalRelief };
}

/**
 * Normalize user inputs into a structured tax input object.
 */
export function normalizeInputs(raw) {
  const mode = raw.mode || "quick";
  const ageCategory = raw.ageCategory || "below60";
  const isResident = raw.residentialStatus !== "nri";
  const incomeType = raw.incomeType || "salaried";
  const isGovtEmployee = Boolean(raw.isGovtEmployee);

  const salary = parseAmount(raw.salary);
  const pension = parseAmount(raw.pension);
  const businessIncome = parseAmount(raw.businessIncome);
  const interestIncome = parseAmount(raw.interestIncome);
  const familyPension = parseAmount(raw.familyPension);
  const otherIncome = parseAmount(raw.otherIncome);

  const basicDA = parseAmount(raw.basicDA) || salary;
  const hraReceived = parseAmount(raw.hraReceived);
  const rentPaid = parseAmount(raw.rentPaid);
  const isMetro =
    raw.isMetro === true ||
    raw.isMetro === "true" ||
    isMetroCity(raw.city) ||
    raw.cityType === "metro";
  const ltaExemption = parseAmount(raw.ltaExemption);

  const selfOccupiedInterest = parseAmount(raw.selfOccupiedInterest);
  const letOutRent = parseAmount(raw.letOutRent);
  const letOutMunicipalTax = parseAmount(raw.letOutMunicipalTax);
  const letOutInterest = parseAmount(raw.letOutInterest);

  const section80C = parseAmount(raw.section80C);
  const section80CCD1B = parseAmount(raw.section80CCD1B);
  const employerNPS = parseAmount(raw.employerNPS);
  const section80DSelf = parseAmount(raw.section80DSelf);
  const section80DParents = parseAmount(raw.section80DParents);
  const parentsAreSenior = Boolean(raw.parentsAreSenior);
  const section80E = parseAmount(raw.section80E);
  const section80G = parseAmount(raw.section80G);
  const section80TTA = parseAmount(raw.section80TTA);
  const section80TTB = parseAmount(raw.section80TTB);
  const hasHRA = Boolean(raw.hasHRA) || hraReceived > 0;
  const use80GG = Boolean(raw.use80GG) || (!hasHRA && rentPaid > 0);

  // Quick mode: single gross + optional old deductions lump
  const quickIncome = parseAmount(raw.quickIncome);
  const quickOldDeductions = parseAmount(raw.quickOldDeductions);
  const quickHasSalary = raw.quickHasSalary !== false && raw.quickHasSalary !== "false";

  // Special rate incomes (taxed separately; excluded from 87A)
  const stcg111A = parseAmount(raw.stcg111A);
  const ltcg112A = parseAmount(raw.ltcg112A);
  const lotteryIncome = parseAmount(raw.lotteryIncome);
  const stcgRate = 0.2; // approx post-Budget 2024 STCG equity
  const ltcgRate = 0.125; // 12.5% LTCG
  const ltcgExemption = 125000;

  return {
    mode,
    ageCategory,
    isResident,
    incomeType,
    isGovtEmployee,
    salary,
    pension,
    businessIncome,
    interestIncome,
    familyPension,
    otherIncome,
    basicDA,
    hraReceived,
    rentPaid,
    isMetro,
    ltaExemption,
    selfOccupiedInterest,
    letOutRent,
    letOutMunicipalTax,
    letOutInterest,
    section80C,
    section80CCD1B,
    employerNPS,
    section80DSelf,
    section80DParents,
    parentsAreSenior,
    section80E,
    section80G,
    section80TTA,
    section80TTB,
    hasHRA,
    use80GG,
    quickIncome,
    quickOldDeductions,
    quickHasSalary,
    stcg111A,
    ltcg112A,
    lotteryIncome,
    stcgRate,
    ltcgRate,
    ltcgExemption,
  };
}

function employerNPSCap(basicDA, regime, isGovt) {
  const pct =
    regime === "new"
      ? LIMITS.npsEmployerPct.new
      : isGovt
        ? LIMITS.npsEmployerPct.oldGovt
        : LIMITS.npsEmployerPct.oldPrivate;
  return Math.max(0, basicDA) * pct;
}

/**
 * Compute tax for one regime given normalized inputs.
 */
export function calculateRegimeTax(inputs, regime) {
  const isNew = regime === "new";
  const notes = [];

  let salaryIncome = 0;
  let pensionIncome = 0;
  let businessIncome = 0;
  let interestIncome = 0;
  let familyPension = 0;
  let otherIncome = 0;
  let hraExemption = 0;
  let ltaExemption = 0;
  let stdDeduction = 0;
  let housePropertyIncome = 0;
  let deductionsChapterVIA = 0;
  let deductionDetails = [];

  if (inputs.mode === "quick") {
    const gross = inputs.quickIncome;
    const hasSalaryLike =
      inputs.quickHasSalary ||
      inputs.incomeType === "salaried" ||
      inputs.incomeType === "pensioner" ||
      inputs.incomeType === "mixed";

    if (hasSalaryLike) {
      salaryIncome = gross;
      stdDeduction = Math.min(
        isNew ? STANDARD_DEDUCTION.new : STANDARD_DEDUCTION.old,
        salaryIncome
      );
    } else {
      businessIncome = gross;
    }

    if (!isNew && inputs.quickOldDeductions > 0) {
      const capped = inputs.quickOldDeductions;
      deductionsChapterVIA += capped;
      deductionDetails.push({
        label: "Estimated deductions (80C/80D/etc.)",
        amount: capped,
      });
    }
  } else {
    salaryIncome = inputs.salary;
    pensionIncome = inputs.pension;
    businessIncome = inputs.businessIncome;
    interestIncome = inputs.interestIncome;
    familyPension = inputs.familyPension;
    otherIncome = inputs.otherIncome;

    const salaryLike = salaryIncome + pensionIncome;
    if (salaryLike > 0) {
      stdDeduction = Math.min(
        isNew ? STANDARD_DEDUCTION.new : STANDARD_DEDUCTION.old,
        salaryLike
      );
    }

    if (!isNew) {
      hraExemption = calculateHRAExemption({
        basicDA: inputs.basicDA,
        hraReceived: inputs.hraReceived,
        rentPaid: inputs.rentPaid,
        isMetro: inputs.isMetro,
      });
      ltaExemption = Math.min(inputs.ltaExemption, salaryIncome);
    }

    // House property
    if (inputs.letOutRent > 0 || inputs.letOutInterest > 0) {
      housePropertyIncome += calculateLetOutHouseProperty({
        annualRent: inputs.letOutRent,
        municipalTax: inputs.letOutMunicipalTax,
        interestPaid: inputs.letOutInterest,
      });
    }
    if (!isNew && inputs.selfOccupiedInterest > 0) {
      const soInterest = Math.min(
        inputs.selfOccupiedInterest,
        LIMITS.section24bSelfOccupied
      );
      // Applied under house-property head (not Chapter VI-A) — avoid double-count in UI
      housePropertyIncome -= soInterest;
    }
  }

  // Family pension deduction (both regimes, different caps) — netted into taxable FP
  const fpDeduction = calculateFamilyPensionDeduction(familyPension, regime);
  const familyPensionTaxable = Math.max(0, familyPension - fpDeduction);

  // Gross salary after exemptions (HRA/LTA reduce salary head)
  const grossSalary =
    Math.max(0, salaryIncome - hraExemption - ltaExemption) + pensionIncome;
  const incomeAfterStd = Math.max(0, grossSalary - stdDeduction);

  // Employer NPS 80CCD(2) — both regimes
  let employerNPS = 0;
  if (inputs.mode === "detailed" && inputs.employerNPS > 0) {
    const cap = employerNPSCap(
      inputs.basicDA || inputs.salary,
      regime,
      inputs.isGovtEmployee
    );
    employerNPS = Math.min(inputs.employerNPS, cap);
    if (employerNPS > 0) {
      deductionDetails.push({
        label: "Employer NPS u/s 80CCD(2)",
        amount: employerNPS,
      });
    }
  }

  // Old-regime Chapter VI-A (detailed)
  if (!isNew && inputs.mode === "detailed") {
    const c80 = Math.min(inputs.section80C, LIMITS.section80C);
    if (c80 > 0) {
      deductionsChapterVIA += c80;
      deductionDetails.push({ label: "Section 80C", amount: c80 });
    }

    const ccd1b = Math.min(inputs.section80CCD1B, LIMITS.section80CCD1B);
    if (ccd1b > 0) {
      deductionsChapterVIA += ccd1b;
      deductionDetails.push({ label: "Section 80CCD(1B) NPS", amount: ccd1b });
    }

    const selfSenior =
      inputs.ageCategory === "senior" || inputs.ageCategory === "superSenior";
    const d80 = calculate80D({
      selfPremium: inputs.section80DSelf,
      parentsPremium: inputs.section80DParents,
      selfIsSenior: selfSenior,
      parentsAreSenior: inputs.parentsAreSenior,
    });
    if (d80 > 0) {
      deductionsChapterVIA += d80;
      deductionDetails.push({ label: "Section 80D", amount: d80 });
    }

    if (inputs.section80E > 0) {
      deductionsChapterVIA += inputs.section80E;
      deductionDetails.push({
        label: "Section 80E (education loan)",
        amount: inputs.section80E,
      });
    }

    if (inputs.section80G > 0) {
      deductionsChapterVIA += inputs.section80G;
      deductionDetails.push({ label: "Section 80G", amount: inputs.section80G });
    }

    if (
      inputs.ageCategory === "senior" ||
      inputs.ageCategory === "superSenior"
    ) {
      const ttb = Math.min(inputs.section80TTB, LIMITS.section80TTB);
      if (ttb > 0) {
        deductionsChapterVIA += ttb;
        deductionDetails.push({ label: "Section 80TTB", amount: ttb });
      }
    } else {
      const tta = Math.min(inputs.section80TTA, LIMITS.section80TTA);
      if (tta > 0) {
        deductionsChapterVIA += tta;
        deductionDetails.push({ label: "Section 80TTA", amount: tta });
      }
    }

    if (inputs.use80GG && !inputs.hasHRA && inputs.rentPaid > 0) {
      // Approximate ATI before 80GG
      const atiApprox =
        incomeAfterStd +
        businessIncome +
        interestIncome +
        familyPensionTaxable +
        otherIncome +
        Math.max(0, housePropertyIncome);
      const gg = calculate80GG({
        rentPaid: inputs.rentPaid,
        adjustedTotalIncome: Math.max(0, atiApprox - deductionsChapterVIA),
      });
      if (gg > 0) {
        deductionsChapterVIA += gg;
        deductionDetails.push({ label: "Section 80GG", amount: gg });
      }
    }
  }

  deductionsChapterVIA += employerNPS;

  const normalIncomeBeforeDeductions =
    incomeAfterStd +
    businessIncome +
    interestIncome +
    familyPensionTaxable +
    otherIncome +
    housePropertyIncome;

  // Taxable normal income (cannot go below 0 for slab purposes on positive side;
  // house property loss can reduce other income)
  let taxableNormal = Math.max(0, normalIncomeBeforeDeductions - deductionsChapterVIA);

  // Special rate incomes
  const specialSTCG = inputs.stcg111A;
  const specialLTCG = Math.max(0, inputs.ltcg112A - inputs.ltcgExemption);
  const specialLottery = inputs.lotteryIncome;
  const specialIncomeTotal = specialSTCG + inputs.ltcg112A + specialLottery;

  // Total income for surcharge = taxable normal + special (gross special for surcharge base)
  // Practically: taxable income including special gains
  const totalIncomeForSurcharge =
    taxableNormal + specialSTCG + specialLTCG + specialLottery;

  // 87A eligibility income = total income excluding special-rate income
  const incomeForRebate = taxableNormal;

  const slabs = isNew
    ? NEW_REGIME_SLABS
    : getOldRegimeSlabs(inputs.ageCategory, inputs.isResident);

  const { tax: slabTax, breakdown: slabBreakdown } = calculateSlabTax(
    taxableNormal,
    slabs
  );

  const rebateResult = applyRebate87A({
    taxOnNormalIncome: slabTax,
    totalIncomeForRebate: incomeForRebate,
    regime,
    isResident: inputs.isResident,
  });

  let taxAfterRebate = rebateResult.taxAfterRebate;

  // Special rate tax (after rebate on normal only)
  const specialTax =
    specialSTCG * inputs.stcgRate +
    specialLTCG * inputs.ltcgRate +
    specialLottery * 0.3;

  const taxBeforeSurcharge = taxAfterRebate + specialTax;

  const taxAtIncomeFn = (atIncome) => {
    // Approximate: scale is imperfect; recompute slab on capped normal income
    const cappedNormal = Math.min(taxableNormal, atIncome);
    const { tax } = calculateSlabTax(cappedNormal, slabs);
    const r = applyRebate87A({
      taxOnNormalIncome: tax,
      totalIncomeForRebate: cappedNormal,
      regime,
      isResident: inputs.isResident,
    });
    return r.taxAfterRebate;
  };

  const surchargeResult = applySurchargeWithRecalc({
    taxAfterRebate: taxBeforeSurcharge,
    totalIncome: totalIncomeForSurcharge,
    regime,
    taxAtIncomeFn,
  });

  const taxPlusSurcharge = taxBeforeSurcharge + surchargeResult.surcharge;
  const cess = taxPlusSurcharge * CESS_RATE;
  const totalTax = taxPlusSurcharge + cess;

  const grossTotalIncome =
    (inputs.mode === "quick"
      ? inputs.quickIncome
      : salaryIncome +
        pensionIncome +
        businessIncome +
        interestIncome +
        familyPension +
        otherIncome +
        Math.max(0, inputs.letOutRent) +
        specialIncomeTotal) || 0;

  const effectiveRate =
    grossTotalIncome > 0 ? (totalTax / grossTotalIncome) * 100 : 0;

  if (isNew && !inputs.isResident) {
    notes.push("NRI: Section 87A rebate is not available.");
  }
  if (isNew && (inputs.ageCategory === "senior" || inputs.ageCategory === "superSenior")) {
    notes.push(
      "New regime: no higher basic exemption for senior/super-senior citizens."
    );
  }

  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const round0 = (n) => Math.round(Number(n) || 0);

  return {
    regime,
    grossSalary: round0(grossSalary),
    salaryIncome: round0(salaryIncome),
    pensionIncome: round0(pensionIncome),
    businessIncome: round0(businessIncome),
    interestIncome: round0(interestIncome),
    familyPension: round0(familyPension),
    familyPensionTaxable: round0(familyPensionTaxable),
    familyPensionDeduction: round0(fpDeduction),
    otherIncome: round0(otherIncome),
    hraExemption: round0(hraExemption),
    ltaExemption: round0(ltaExemption),
    stdDeduction: round0(stdDeduction),
    housePropertyIncome: round0(housePropertyIncome),
    deductionsChapterVIA: round0(deductionsChapterVIA),
    deductionDetails,
    taxableNormal: round0(taxableNormal),
    specialTax: round0(specialTax),
    specialSTCG: round0(specialSTCG),
    specialLTCG: round0(specialLTCG),
    specialLottery: round0(specialLottery),
    slabTax: round0(slabTax),
    slabBreakdown: slabBreakdown.map((s) => ({
      ...s,
      amount: round0(s.amount),
      tax: round2(s.tax),
    })),
    rebate: round0(rebateResult.rebate),
    rebateMarginalRelief: round0(rebateResult.marginalRelief),
    taxAfterRebate: round0(taxAfterRebate),
    surcharge: round0(surchargeResult.surcharge),
    surchargeBeforeRelief: round0(surchargeResult.surchargeBeforeRelief),
    surchargeRate: surchargeResult.surchargeRate,
    surchargeMarginalRelief: round0(surchargeResult.marginalRelief),
    cess: round0(cess),
    totalTax: round0(totalTax),
    effectiveRate,
    monthlyTax: round0(totalTax / 12),
    takeHomeMonthly:
      grossTotalIncome > 0 ? round0((grossTotalIncome - totalTax) / 12) : 0,
    grossTotalIncome: round0(grossTotalIncome),
    incomeForRebate: round0(incomeForRebate),
    notes,
  };
}

export function compareRegimes(rawInputs) {
  const inputs = normalizeInputs(rawInputs);
  const newResult = calculateRegimeTax(inputs, "new");
  const oldResult = calculateRegimeTax(inputs, "old");

  const savings = oldResult.totalTax - newResult.totalTax;
  let recommended = "new";
  if (savings < -1) recommended = "old";
  else if (Math.abs(savings) <= 1) recommended = "either";

  let tip = "";
  if (recommended === "new" && inputs.mode === "quick") {
    const gap = newResult.totalTax - oldResult.totalTax;
    if (gap < 0) {
      /* new is cheaper */
    }
  }
  if (recommended === "new" && oldResult.totalTax > newResult.totalTax) {
    // How much more old-regime deduction needed roughly to break even
    // Rough: need to reduce old taxable enough that tax drops by the difference
    const diff = oldResult.totalTax - newResult.totalTax;
    tip = `New regime saves ₹${formatINR(diff)} based on current inputs.`;
  } else if (recommended === "old") {
    const diff = newResult.totalTax - oldResult.totalTax;
    tip = `Old regime saves ₹${formatINR(diff)} with your deductions.`;
  } else {
    tip = "Both regimes result in almost the same tax.";
  }

  // Break-even hint for quick mode
  if (
    inputs.mode === "quick" &&
    recommended === "new" &&
    oldResult.totalTax > newResult.totalTax
  ) {
    const target = newResult.totalTax;
    // Binary search approximate extra deductions for old to match new
    let lo = inputs.quickOldDeductions;
    let hi = lo + 2000000;
    let best = null;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      const trial = calculateRegimeTax(
        normalizeInputs({ ...rawInputs, quickOldDeductions: mid }),
        "old"
      );
      if (trial.totalTax > target) lo = mid;
      else {
        best = mid;
        hi = mid;
      }
    }
    if (best != null && best > inputs.quickOldDeductions + 100) {
      const need = best - inputs.quickOldDeductions;
      tip += ` Roughly ₹${formatINR(need)} more old-regime deductions may be needed to break even.`;
    }
  }

  return {
    inputs,
    new: newResult,
    old: oldResult,
    savings: Math.abs(savings),
    savingsSign: Math.sign(savings), // + means new is cheaper
    recommended,
    tip,
  };
}
