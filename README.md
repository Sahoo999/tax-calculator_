<div align="center">

### India Income Tax Calculator — Old vs New Tax Regime

[![HTML5](https://img.shields.io/badge/HTML5-Frontend-E34F26?style=for-the-badge\&logo=html5\&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Styling-1572B6?style=for-the-badge\&logo=css3\&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-Logic-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge\&logo=vercel\&logoColor=white)](https://vercel.com/)

*Compare India's old and new tax regimes with detailed deductions, rebates, surcharge, and cess — instantly in your browser.*

[🌐 Live Demo](https://tax-calculator-five-jet.vercel.app/) · [Features](#-key-features) · [Run Locally](#-running-locally)

</div>

<br>

## 🎯 The Problem

Indian income-tax calculations can quickly become complicated when salary, HRA, deductions, NPS, house property income, senior-citizen rules, and different tax regimes are involved.

**TaxClear simplifies that process.**

Enter your income and deductions, and get a clear **old vs new regime comparison** with the recommended option and complete tax breakdown.

<br>

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### ⚖️ Old vs New Comparison

Calculate both tax regimes side-by-side and instantly see which option results in lower tax.

</td>
<td width="50%" valign="top">

### 🧮 Detailed Tax Calculation

Includes tax slabs, Section 87A rebate, surcharge, and **4% Health & Education Cess**.

</td>
</tr>

<tr>
<td width="50%" valign="top">

### 💼 Salary & Business Income

Supports salaried, pension, business/professional, and mixed-income scenarios.

</td>
<td width="50%" valign="top">

### 🏠 HRA & Deductions

Supports HRA, 80C, 80D, NPS, LTA, home-loan interest, 80E, 80G, 80TTA, and 80TTB.

</td>
</tr>

<tr>
<td width="50%" valign="top">

### 👴 Senior Citizens

Supports below 60, senior citizens, and super-senior citizens with applicable old-regime treatment.

</td>
<td width="50%" valign="top">

### 📈 Special-Rate Income

Handles STCG 111A, LTCG 112A, and lottery/gambling income separately.

</td>
</tr>
</table>

<br>

## 🏗️ How It Works

```mermaid
flowchart LR
    A["👤 User Input"] --> B["🧮 Tax Engine"]
    B --> C["🆕 New Regime"]
    B --> D["📜 Old Regime"]
    C --> E["⚖️ Compare"]
    D --> E
    E --> F["💡 Recommendation"]
    E --> G["📊 Breakdown"]

    style A fill:#1a1d2e,stroke:#3a5bf0,color:#fff
    style B fill:#17261f,stroke:#3dcc7e,color:#fff
    style E fill:#211a2b,stroke:#a07ee0,color:#fff
```

<br>

## 🛠️ Tech Stack

<div align="center">

| Layer          | Technology                       |
| :------------- | :------------------------------- |
| **Frontend**   | HTML5 · CSS3                     |
| **Logic**      | Vanilla JavaScript               |
| **Deployment** | Vercel                           |
| **SEO**        | Meta Tags · Open Graph · JSON-LD |
| **Analytics**  | Google Analytics                 |
| **Assets**     | SVG · Google Fonts               |

</div>

<br>

## 🚀 Running Locally

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_REPOSITORY_FOLDER>
```

Run a local server:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

Or simply open `index.html` directly in your browser.

<br>

## 📁 Project Structure

```text
├── index.html          # Calculator UI + SEO metadata
├── styles.css          # Responsive styling + themes
├── script.js           # Tax calculation engine
├── favicon.svg         # Favicon
├── og-image.svg        # Social sharing image
├── site.webmanifest    # Web app manifest
└── README.md
```

<br>

## 💡 Design Decisions Worth Knowing

<details>
<summary><b>Why compare both regimes?</b></summary>
<br>

The better regime depends on income, deductions, exemptions, and taxpayer profile. TaxClear calculates both so users can make the comparison immediately instead of doing it manually.

</details>

<details>
<summary><b>Why Quick and Detailed modes?</b></summary>
<br>

Quick Mode provides a fast estimate with minimal inputs, while Detailed Mode gives users control over HRA, deductions, NPS, house property, and special-rate income.

</details>

<details>
<summary><b>Why client-side calculation?</b></summary>
<br>

The calculator runs directly in the browser, keeping the application lightweight and avoiding the need for a backend or database for the core calculation.

</details>

<br>

---

<div align="center">

### 🧮 TaxClear

*Compare. Understand. Choose.*

[🌐 Live Calculator](https://tax-calculator-five-jet.vercel.app/)

*Built with HTML, CSS & JavaScript.*

</div>
