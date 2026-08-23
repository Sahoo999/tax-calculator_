import { compareRegimes, formatINR } from "./tax-engine.js";

const FIELD_IDS = [
  "ageCategory",
  "residentialStatus",
  "incomeType",
  "quickIncome",
  "quickHasSalary",
  "quickOldDeductions",
  "salary",
  "basicDA",
  "pension",
  "businessIncome",
  "interestIncome",
  "familyPension",
  "otherIncome",
  "hraReceived",
  "rentPaid",
  "cityType",
  "ltaExemption",
  "use80GG",
  "selfOccupiedInterest",
  "letOutRent",
  "letOutMunicipalTax",
  "letOutInterest",
  "isGovtEmployee",
  "employerNPS",
  "section80C",
  "section80CCD1B",
  "section80DSelf",
  "section80DParents",
  "parentsAreSenior",
  "section80E",
  "section80G",
  "section80TTA",
  "section80TTB",
  "stcg111A",
  "ltcg112A",
  "lotteryIncome",
];

const SAMPLES = {
  salariedMetro: {
    mode: "detailed",
    ageCategory: "below60",
    residentialStatus: "resident",
    incomeType: "salaried",
    salary: 1800000,
    basicDA: 900000,
    hraReceived: 360000,
    rentPaid: 420000,
    cityType: "metro",
    section80C: 150000,
    section80DSelf: 25000,
    section80CCD1B: 50000,
    employerNPS: 90000,
    selfOccupiedInterest: 0,
    quickIncome: 1800000,
    quickOldDeductions: 225000,
    quickHasSalary: true,
  },
  seniorPensioner: {
    mode: "detailed",
    ageCategory: "senior",
    residentialStatus: "resident",
    incomeType: "pensioner",
    pension: 900000,
    interestIncome: 120000,
    section80TTB: 50000,
    section80DSelf: 50000,
    section80C: 100000,
    quickIncome: 1020000,
    quickOldDeductions: 200000,
    quickHasSalary: true,
  },
  business44ada: {
    mode: "detailed",
    ageCategory: "below60",
    residentialStatus: "resident",
    incomeType: "business",
    businessIncome: 1500000,
    interestIncome: 30000,
    section80C: 150000,
    section80DSelf: 25000,
    quickIncome: 1530000,
    quickOldDeductions: 175000,
    quickHasSalary: false,
  },
};

let currentMode = "quick";
let debounceTimer = null;

function $(id) {
  return document.getElementById(id);
}

function getFormValues() {
  const values = { mode: currentMode };
  for (const id of FIELD_IDS) {
    const el = $(id);
    if (!el) continue;
    if (el.type === "checkbox") values[id] = el.checked;
    else values[id] = el.value;
  }
  values.isMetro = values.cityType === "metro";
  values.hasHRA = Number(values.hraReceived) > 0;
  return values;
}

function setFormValues(data) {
  if (data.mode) setMode(data.mode);
  for (const id of FIELD_IDS) {
    if (data[id] === undefined) continue;
    const el = $(id);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = Boolean(data[id]);
    else el.value = data[id];
  }
  updateConditionalFields();
  recalculate();
}

function setMode(mode) {
  currentMode = mode === "detailed" ? "detailed" : "quick";
  $("modeQuick")?.classList.toggle("is-active", currentMode === "quick");
  $("modeDetailed")?.classList.toggle("is-active", currentMode === "detailed");
  $("quickSection")?.classList.toggle("is-hidden", currentMode !== "quick");
  $("detailedSection")?.classList.toggle("is-hidden", currentMode !== "detailed");
}

function updateConditionalFields() {
  const incomeType = $("incomeType")?.value || "salaried";
  const age = $("ageCategory")?.value || "below60";
  const isSenior = age === "senior" || age === "superSenior";

  document.querySelectorAll("[data-show-for]").forEach((el) => {
    const allowed = el.getAttribute("data-show-for").split(/\s+/);
    el.classList.toggle("is-hidden", !allowed.includes(incomeType));
  });

  document.querySelectorAll("[data-senior-only]").forEach((el) => {
    el.classList.toggle("is-hidden", !isSenior);
  });
  document.querySelectorAll("[data-senior-hide]").forEach((el) => {
    el.classList.toggle("is-hidden", isSenior);
  });
}

function syncSalaryToggleFromIncomeType() {
  const incomeType = $("incomeType")?.value || "salaried";
  const salaryToggle = $("quickHasSalary");
  if (!salaryToggle) return;
  if (incomeType === "business") salaryToggle.checked = false;
  else if (incomeType === "salaried" || incomeType === "pensioner") {
    salaryToggle.checked = true;
  }
}

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  document.documentElement.style.colorScheme = next;
  try {
    localStorage.setItem("taxclear-theme", next);
  } catch {
    /* ignore */
  }
  const label = $("themeToggleText");
  if (label) label.textContent = next === "dark" ? "Light" : "Dark";
  const btn = $("themeToggle");
  if (btn) {
    btn.setAttribute(
      "aria-label",
      next === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  }
  // Sync theme-color for mobile browsers
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => {
      const media = meta.getAttribute("media") || "";
      if (next === "dark" && media.includes("dark")) meta.content = "#000000";
      if (next === "light" && media.includes("light")) meta.content = "#0f6e6a";
    });
}

function toggleTheme() {
  applyTheme(getTheme() === "dark" ? "light" : "dark");
}

function money(n) {
  const value = Number(n) || 0;
  const sign = value < 0 ? "−" : "";
  return `${sign}₹${formatINR(Math.abs(value))}`;
}

function breakdownHTML(result) {
  const rows = [];
  const push = (label, amount, opts = {}) => {
    if (opts.skipZero && !amount) return;
    const cls = [
      "breakdown-row",
      opts.muted ? "is-muted" : "",
      opts.total ? "is-total" : "",
    ]
      .filter(Boolean)
      .join(" ");
    rows.push(
      `<div class="${cls}"><span>${label}</span><span>${money(amount)}</span></div>`
    );
  };

  if (result.salaryIncome) push("Salary / gross salary income", result.salaryIncome);
  if (result.pensionIncome) push("Pension", result.pensionIncome);
  if (result.businessIncome) push("Business / profession", result.businessIncome);
  if (result.interestIncome) push("Interest income", result.interestIncome);
  if (result.familyPension) {
    push("Family pension (gross)", result.familyPension);
    if (result.familyPensionDeduction) {
      push("Family pension deduction", -result.familyPensionDeduction, {
        muted: true,
      });
    }
    push("Family pension taxable", result.familyPensionTaxable, { muted: true });
  }
  if (result.otherIncome) push("Other income", result.otherIncome);
  if (result.hraExemption) push("HRA exemption", -result.hraExemption, { muted: true });
  if (result.ltaExemption) push("LTA exemption", -result.ltaExemption, { muted: true });
  if (result.stdDeduction) push("Standard deduction", -result.stdDeduction);
  if (result.housePropertyIncome)
    push("House property income/(loss)", result.housePropertyIncome);

  for (const d of result.deductionDetails || []) {
    push(d.label, -d.amount, { muted: true });
  }

  push("Taxable income (normal)", result.taxableNormal);

  if (result.slabBreakdown?.length) {
    rows.push(`<ul class="slab-list">`);
    for (const s of result.slabBreakdown) {
      const toLabel = s.to == null ? "above" : money(s.to);
      rows.push(
        `<li><span>${money(s.from)} – ${toLabel} @ ${s.rate * 100}%</span><span>${money(s.tax)}</span></li>`
      );
    }
    rows.push(`</ul>`);
  }

  push("Tax as per slabs", result.slabTax);
  if (result.rebate) push("Rebate u/s 87A", -result.rebate);
  if (result.rebateMarginalRelief)
    push("Marginal relief (87A)", -result.rebateMarginalRelief, { muted: true });
  push("Tax after rebate", result.taxAfterRebate);
  if (result.specialTax) push("Tax on special-rate income", result.specialTax);
  if (result.surchargeBeforeRelief) {
    push(
      `Surcharge (${(result.surchargeRate * 100).toFixed(0)}%)`,
      result.surchargeBeforeRelief
    );
    if (result.surchargeMarginalRelief) {
      push("Marginal relief on surcharge", -result.surchargeMarginalRelief, {
        muted: true,
      });
      push("Surcharge after relief", result.surcharge, { muted: true });
    }
  }
  push("Health & Education Cess (4%)", result.cess);
  push("Total tax liability", result.totalTax, { total: true });

  if (result.notes?.length) {
    rows.push(
      `<p class="hint" style="margin-top:0.75rem">${result.notes.join(" ")}</p>`
    );
  }

  return rows.join("");
}

function render(comparison) {
  const { new: neu, old, recommended, savings, tip } = comparison;

  $("newTotal").textContent = money(neu.totalTax);
  $("oldTotal").textContent = money(old.totalTax);
  $("newMeta").textContent = `Effective ${neu.effectiveRate.toFixed(1)}% · ~${money(neu.takeHomeMonthly)}/mo take-home`;
  $("oldMeta").textContent = `Effective ${old.effectiveRate.toFixed(1)}% · ~${money(old.takeHomeMonthly)}/mo take-home`;

  document.querySelectorAll(".tax-card").forEach((card) => {
    const regime = card.getAttribute("data-regime");
    card.classList.toggle(
      "is-winner",
      recommended === regime || (recommended === "either" && regime === "new")
    );
  });

  const rec = $("recommendation");
  if (recommended === "either") {
    rec.innerHTML = `<div class="rec-banner"><span class="rec-title">Both regimes are similar</span><span class="rec-save">Difference under ₹1</span></div>`;
    $("mobileRec").textContent = "Either";
    $("mobileTax").textContent = money(neu.totalTax);
  } else if (recommended === "new") {
    rec.innerHTML = `<div class="rec-banner"><span class="rec-title">New regime is better</span><span class="rec-save">You save ${money(savings)}</span></div>`;
    $("mobileRec").textContent = "New";
    $("mobileTax").textContent = money(neu.totalTax);
  } else {
    rec.innerHTML = `<div class="rec-banner is-old"><span class="rec-title">Old regime is better</span><span class="rec-save">You save ${money(savings)}</span></div>`;
    $("mobileRec").textContent = "Old";
    $("mobileTax").textContent = money(old.totalTax);
  }

  $("tipText").textContent = tip;
  $("newBreakdown").innerHTML = breakdownHTML(neu);
  $("oldBreakdown").innerHTML = breakdownHTML(old);

  updatePrintSummary(comparison);
}

function updatePrintSummary(comparison) {
  const el = $("printSummary");
  if (!el) return;
  const { new: neu, old, recommended, savings } = comparison;
  el.hidden = false;
  el.innerHTML = `
    <h2>Tax summary — FY 2025-26 (AY 2026-27)</h2>
    <table>
      <thead>
        <tr><th>Particulars</th><th>New regime</th><th>Old regime</th></tr>
      </thead>
      <tbody>
        <tr><td>Taxable income</td><td>${money(neu.taxableNormal)}</td><td>${money(old.taxableNormal)}</td></tr>
        <tr><td>Tax before cess</td><td>${money(neu.taxAfterRebate + neu.surcharge)}</td><td>${money(old.taxAfterRebate + old.surcharge)}</td></tr>
        <tr><td>Cess (4%)</td><td>${money(neu.cess)}</td><td>${money(old.cess)}</td></tr>
        <tr><td><strong>Total tax</strong></td><td><strong>${money(neu.totalTax)}</strong></td><td><strong>${money(old.totalTax)}</strong></td></tr>
      </tbody>
    </table>
    <p style="margin-top:0.75rem">Recommended: <strong>${recommended === "either" ? "Either" : recommended === "new" ? "New regime" : "Old regime"}</strong>
    ${recommended !== "either" ? ` (save ${money(savings)})` : ""}</p>
  `;
}

function recalculate() {
  const values = getFormValues();
  const comparison = compareRegimes(values);
  render(comparison);
  return comparison;
}

function scheduleRecalc() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(recalculate, 120);
}

function readURLState() {
  const params = new URLSearchParams(window.location.search);
  if (![...params.keys()].length) return null;
  const data = {};
  for (const [key, value] of params.entries()) {
    if (value === "true") data[key] = true;
    else if (value === "false") data[key] = false;
    else data[key] = value;
  }
  return data;
}

function writeURLState() {
  const values = getFormValues();
  const params = new URLSearchParams();
  params.set("mode", values.mode);
  const keys = [
    "ageCategory",
    "residentialStatus",
    "incomeType",
    "quickIncome",
    "quickOldDeductions",
    "quickHasSalary",
    "salary",
    "basicDA",
    "pension",
    "businessIncome",
    "interestIncome",
    "familyPension",
    "section80C",
    "employerNPS",
  ];
  for (const k of keys) {
    if (values[k] === undefined || values[k] === "" || values[k] === 0 || values[k] === "0")
      continue;
    params.set(k, String(values[k]));
  }
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", url);
  return `${window.location.origin}${url}`;
}

async function copyShareLink() {
  const link = writeURLState();
  try {
    await navigator.clipboard.writeText(link);
    const btn = $("shareBtn");
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = "Link copied!";
      setTimeout(() => {
        btn.textContent = prev;
      }, 1600);
    }
  } catch {
    window.prompt("Copy this link:", link);
  }
}

function bindEvents() {
  $("modeQuick")?.addEventListener("click", () => {
    setMode("quick");
    recalculate();
  });
  $("modeDetailed")?.addEventListener("click", () => {
    setMode("detailed");
    recalculate();
  });

  $("taxForm")?.addEventListener("input", scheduleRecalc);
  $("taxForm")?.addEventListener("change", (event) => {
    updateConditionalFields();
    if (event.target?.id === "incomeType") {
      syncSalaryToggleFromIncomeType();
    }
    scheduleRecalc();
  });

  document.querySelectorAll("[data-sample]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-sample");
      const sample = SAMPLES[key];
      if (sample) setFormValues({ ...sample });
    });
  });

  $("shareBtn")?.addEventListener("click", copyShareLink);
  $("printBtn")?.addEventListener("click", () => {
    writeURLState();
    window.print();
  });

  $("themeToggle")?.addEventListener("click", toggleTheme);

  document.querySelectorAll(".breakdown-acc").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      document.querySelectorAll(".breakdown-acc").forEach((other) => {
        if (other !== details) other.open = false;
      });
    });
  });
}

export function initUI() {
  applyTheme(getTheme());
  bindEvents();
  const fromURL = readURLState();
  if (fromURL) {
    setFormValues(fromURL);
  } else {
    setMode("quick");
    updateConditionalFields();
    recalculate();
  }
}
