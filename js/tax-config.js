/**
 * Tax rates & limits for FY 2026-27 (AY 2026-27)
 * Sources: incometaxindia.gov.in, ClearTax, Budget 2026
 */
export const ASSESSMENT_YEAR = "AY 2027-28";
export const FINANCIAL_YEAR = "FY 2026-27";

export const CESS_RATE = 0.04;

export const STANDARD_DEDUCTION = {
  new: 75000,
  old: 50000,
};

export const REBATE_87A = {
  new: { incomeLimit: 1200000, maxRebate: 60000 },
  old: { incomeLimit: 500000, maxRebate: 12500 },
};

/** New regime slabs — uniform for all ages */
export const NEW_REGIME_SLABS = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 0.05 },
  { upTo: 1200000, rate: 0.1 },
  { upTo: 1600000, rate: 0.15 },
  { upTo: 2000000, rate: 0.2 },
  { upTo: 2400000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

/** Old regime slabs by age category (resident). NRI uses below60. */
export const OLD_REGIME_SLABS = {
  below60: [
    { upTo: 250000, rate: 0 },
    { upTo: 500000, rate: 0.05 },
    { upTo: 1000000, rate: 0.2 },
    { upTo: Infinity, rate: 0.3 },
  ],
  senior: [
    { upTo: 300000, rate: 0 },
    { upTo: 500000, rate: 0.05 },
    { upTo: 1000000, rate: 0.2 },
    { upTo: Infinity, rate: 0.3 },
  ],
  superSenior: [
    { upTo: 500000, rate: 0 },
    { upTo: 1000000, rate: 0.2 },
    { upTo: Infinity, rate: 0.3 },
  ],
};

/** Surcharge brackets: [incomeThreshold, rate] */
export const SURCHARGE = {
  new: [
    { above: 5000000, rate: 0.1 },
    { above: 10000000, rate: 0.15 },
    { above: 20000000, rate: 0.25 },
  ],
  old: [
    { above: 5000000, rate: 0.1 },
    { above: 10000000, rate: 0.15 },
    { above: 20000000, rate: 0.25 },
    { above: 50000000, rate: 0.37 },
  ],
};

export const LIMITS = {
  section80C: 150000,
  section80CCD1B: 50000,
  section80D: {
    selfBelow60: 25000,
    selfSenior: 50000,
    parentsBelow60: 25000,
    parentsSenior: 50000,
    preventiveHealthCheckup: 5000,
  },
  section24bSelfOccupied: 200000,
  section80TTA: 10000,
  section80TTB: 50000,
  section80GGMonthly: 5000,
  familyPensionNew: 25000,
  familyPensionOld: 15000,
  npsEmployerPct: {
    new: 0.14,
    oldPrivate: 0.1,
    oldGovt: 0.14,
  },
};

export const METRO_CITIES = [
  "mumbai",
  "delhi",
  "chennai",
  "kolkata",
  "bengaluru",
  "bangalore",
  "hyderabad",
  "ahmedabad",
  "pune",
];
