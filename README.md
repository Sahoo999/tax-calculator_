
<div align="center">

### Smart Indian Income Tax Calculator

Compare **Old vs New Tax Regimes** and estimate your income tax liability with detailed slab calculations, rebates, surcharge, cess, deductions, HRA, and income-specific rules.

[![Live Demo](https://img.shields.io/badge/Live-Demo-0f6e6a?style=for-the-badge)](YOUR_VERCEL_URL)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

</div>

---

## 📌 Overview

**TaxClear** is a client-side Indian income tax calculator designed to help users estimate and compare their tax liability under the **Old and New Tax Regimes**.

The application provides both a quick calculation mode and a detailed mode for users who want to account for deductions and income components such as:

- Salary / pension income
- Business / professional income
- HRA
- Section 80C
- Section 80D
- NPS
- Home-loan interest
- Savings interest
- Family pension
- Senior-citizen benefits
- Section 87A rebate
- Surcharge
- Health & Education Cess

The application is built using **vanilla HTML, CSS and modern JavaScript ES modules**, without requiring a frontend framework.

---

## ✨ Features

### 🧮 Tax Calculation

- Old Regime tax calculation
- New Regime tax calculation
- Progressive income-tax slab calculation
- Automatic taxable-income calculation
- Standard deduction handling
- Section 87A rebate
- Marginal relief
- Surcharge calculation
- 4% Health & Education Cess
- Final tax liability calculation

### 👤 User Profiles

Supports different taxpayer profiles including:

- Below 60 years
- Senior citizens
- Super senior citizens
- Resident taxpayers
- NRI taxpayers
- Salaried taxpayers
- Business / professional income

### 💰 Deductions & Exemptions

Detailed calculation support for applicable deductions and exemptions such as:

- Section 80C
- Section 80CCD(1B)
- Section 80D
- Section 24(b)
- Section 80TTA
- Section 80TTB
- Section 80GG
- HRA exemption
- Employer NPS contribution
- Family pension deduction

### ⚖️ Regime Comparison

The calculator compares both regimes and helps users identify:

> **Which tax regime results in lower tax?**

The result includes a clear breakdown of:

- Gross income
- Deductions
- Taxable income
- Tax before rebate
- Rebate
- Surcharge
- Cess
- Total tax

### 🎯 Quick Calculation

Users can enter their annual income and immediately compare the two regimes without filling out every detailed deduction.

### 🔍 Detailed Calculation

Advanced users can provide individual income and deduction components for a more granular calculation.

### 🌙 UI Features

- Responsive interface
- Light / dark mode
- Quick and detailed modes
- Sample taxpayer scenarios
- Accessible form controls
- Indian currency formatting
- Mobile-friendly layout

---

## 🏗️ Project Structure

```text
tax-calculator/
│
├── index.html                 # Main application interface
├── styles.css                 # Global styling and responsive design
├── script.js                  # Application entry point
│
├── js/
│   ├── tax-config.js          # Tax rates, slabs and limits
│   ├── tax-engine.js          # Core tax calculation engine
│   ├── tax-engine.test.js     # Automated calculation tests
│   └── ui.js                  # UI state and interaction logic
│
├── favicon.svg                # Browser favicon
├── og-image.svg               # Social sharing image
├── site.webmanifest            # Web app metadata
├── robots.txt                 # Search engine crawling rules
├── sitemap.xml                # Search engine sitemap
├── package.json               # npm configuration
├── package-lock.json          # Dependency lock file
└── README.md                  # Project documentation

---

##🧠 Application Architecture

The project follows a lightweight modular architecture that separates the UI, configuration, and tax calculation logic.

User Input
    │
    ▼
normalizeInputs()
    │
    ▼
Tax Calculation Engine
    │
    ├── Income Calculation
    ├── Deductions
    ├── Tax Slabs
    ├── Standard Deduction
    ├── Section 87A Rebate
    ├── Marginal Relief
    ├── Surcharge
    └── Health & Education Cess
    │
    ▼
Regime Comparison
    │
    ├── Old Regime
    └── New Regime
    │
    ▼
Formatted Results
    │
    ▼
User Interface
