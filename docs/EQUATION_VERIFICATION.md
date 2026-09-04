# Equation Verification Report — Thai CV Risk Score (Non-Lab)

**Module:** HeartCheck Wise – Thai CV Risk Score (Non-Lab)
**Model version (this module):** 1.0.0
**Underlying equation:** Thai CV Risk Score **v2.5 (Rama-Mahidol, 2021)** — non-laboratory (waist-to-height) model
**Verification status:** ✅ **VERIFIED** — linear-predictor coefficients cross-checked against **two independent authoritative sources**; baseline survival / centering taken from the current official reference implementation.
**Technical review date:** 2026-09-04
**Clinical sign-off:** ❌ **NOT yet obtained** (production remains gated — see RELEASE_CHECKLIST.md)

> This report satisfies deliverables **A (verification report)**, **B (source list)** and **C (mathematical specification)**.

---

## A. Verification narrative

### What the tool is
A **primary-prevention**, **10-year** cardiovascular-risk estimator for the Thai population that requires **no laboratory values**. It is the Thai CV Risk Score "no-blood-test" pathway, which substitutes **waist-to-height ratio (WHR)** for the cholesterol term used in the laboratory model.

### How the equation was identified and verified
The project brief **prohibits inventing or guessing** the equation. The equation was therefore obtained from primary sources, in the brief's priority order:

1. **Official reference implementation (primary).** The official Thai CV Risk Score calculator is published by the Faculty of Medicine **Ramathibodi Hospital, Mahidol University**. Its client-side file `scripts/formular.js` (`/*! Thai CV risk score 2.5, Copyright 2021 */`, function `TASCVDformular`) contains the **exact** non-lab equation, coefficients, baseline survival and centering constant. This file was downloaded and archived at `docs/reference-formular.js`.

2. **Independent cross-check.** The Thai **Ministry of Public Health HDC / "43-file" (43 แฟ้ม)** CVD-risk specification (2561/2018) reproduces the same equation for the national data-exchange programme. Its published lab **and** non-lab **linear-predictor coefficients are identical** to the official calculator (verbatim match on all six β terms of each model).

3. **Corroboration of design.** Outcome definition, 10-year horizon, eligibility (Thais 35–70, primary prevention), the fact that the non-lab pathway uses WHR, and the risk bands were all confirmed by additional independent literature (external validation study; Vajira Medical Journal supplement; Frontiers CAC study). See §B.

### Coefficient cross-check result

| Term | Official Rama v2.5 (2021) | MoPH HDC "43-file" (2018) | Match |
|---|---|---|---|
| non-lab β age | 0.079 | 0.079 | ✅ |
| non-lab β sex (male=1) | 0.128 | 0.128 | ✅ |
| non-lab β SBP | 0.019350987 | 0.019350987 | ✅ |
| non-lab β diabetes | 0.58454 | 0.58454 | ✅ |
| non-lab β WHR | 3.512566 | 3.512566 | ✅ |
| non-lab β smoking | 0.459 | 0.459 | ✅ |
| lab β (all six) | 0.08183 / 0.39499 / 0.02084 / 0.69974 / 0.00212 / 0.41916 | identical | ✅ |
| baseline survival S0 | **0.964588** | 0.978296 | ⚠ version difference |
| non-lab centering mean | **7.712325** | 7.720484 | ⚠ version difference |

**Interpretation of the discrepancy.** The **β coefficients are fully verified** (two independent sources agree exactly). The **baseline survival and the non-lab centering constant differ between the 2018 and 2021 releases** — a recalibration between versions. Because the brief prioritises the *current official calculator implementation*, this module adopts the **2021 v2.5** values (`S0 = 0.964588`, non-lab centering `7.712325`) as canonical and validates against that implementation. The 2018 values are documented for audit and could be switched in `src/calculator/thaiCvNonLab.js` if a future clinical review prefers the earlier calibration.

### Known limitations / residual gaps
- **Single implementation source for S0/centering.** The baseline survival and centering constant are taken from one source (the official calculator). No peer-reviewed publication printing the v2.5 S0 to full precision was located; the 2018 HDC document confirms the *coefficients* but uses a different calibration. This is acceptable because the official calculator **is** the national reference tool, and the Golden Validation Set validates reproduction *of that reference implementation*.
- **Waist-circumference-only fallback** (used only if height is missing) is implemented from the same official source but is **not the active pathway** — the app always collects height and uses WHR.
- **Extreme inputs** can produce raw risks approaching 100%. The reference calculator caps the *display* at ">30%"; this module reproduces that display convention while keeping the raw fraction available internally.
- **This is not a clinical sign-off.** Coefficient verification ≠ clinical endorsement. A named Thai clinician must review eligibility rules, wording, and thresholds before production (see release gates).

---

## B. Source list

| # | Role in verification | Source | URL |
|---|---|---|---|
| 1 | **Official reference implementation** (coefficients, S0, centering) | Thai CV Risk Score (Rama-Mahidol), online calculator **v2.5**, Copyright 2021. Faculty of Medicine Ramathibodi Hospital, Mahidol University. `scripts/formular.js` → `TASCVDformular`. | https://www.rama.mahidol.ac.th/cardio_vascular_risk/thai_cv_risk_score/tcvrs_en.html |
| 2 | **Independent cross-check** (identical coefficients) | Thai MoPH — HDC / "43-file" (43 แฟ้ม) CVD Risk standard, Thai CV Risk Score specification (2561/2018). | http://info2.muaklekhospital.com/wp-content/uploads/2018/08/cvd2561_d.pdf |
| 3 | Derivation cohort profile | Vathesatogkit P, Woodward M, Tanomsup S, et al. Cohort profile: the Electricity Generating Authority of Thailand (EGAT) study. *Int J Epidemiol.* 2012;41(2):359-365. | https://doi.org/10.1093/ije/dyq218 |
| 4 | External validation (structure, outcome, WHR, bands) | Aramcharoen S, Satian P, Chotikarn P, Triukose S. An external validation of Thais' cardiovascular 10-year risk assessment in southern Thailand. (Chulalongkorn CUBIC). | https://arxiv.org/abs/1811.03860 |
| 5 | Corroboration (eligibility 35–70; outcome; official URL) | Chopchai K, Wanlapakorn C, Issaragrisil S, et al. Correlation between Thai CV Risk Score and MESA Risk Score in Thai Populations. *Vajira Medical Journal.* 2022;66(2). | https://he02.tci-thaijo.org/index.php/VMED/article/view/249392 |
| 6 | Corroboration (variables; 10-year ASCVD outcome) | Utility of coronary artery calcium in refining 10-year ASCVD risk prediction using a Thai CV risk score. *Front Cardiovasc Med.* 2023;10:1264640. | https://doi.org/10.3389/fcvm.2023.1264640 |

Guideline context (references page): RCPT 2016 Dyslipidemia CPG; Thai Hypertension Society guidelines; Thai MoPH Division of NCDs CVD-risk programme (HDC).

---

## C. Complete mathematical specification

### Scope
| Property | Value |
|---|---|
| Population | Thai adults |
| Prevention type | **Primary prevention** (no established ASCVD) |
| Eligible age | **35–70 years** (official statement; the calculator input widget accepts 30–70) |
| Prediction horizon | **10 years** |
| Outcome | ASCVD = coronary death, or non-fatal MI, **or** fatal/non-fatal stroke |
| Derivation cohort | EGAT (pooled ~20-year cohort) |
| Model family | Cox proportional hazards |

### Variable coding & units
| Variable | Coding / unit |
|---|---|
| `age` | years |
| `sex` | **male = 1, female = 0** |
| `currentSmoker` | yes = 1, no = 0 |
| `diabetes` | yes = 1, no = 0 |
| `sbp` | systolic BP, **mmHg** |
| `waistCm` | waist circumference, **cm** |
| `heightCm` | height, **cm** |
| `WHR` | `waistCm / heightCm` (unitless) |

> **Units note.** The official calculator's UI slider takes waist in *inches* and multiplies by 2.5 to approximate cm before computing `WHR = waist_cm / height_cm`. This module collects waist directly in **cm** (clinical standard) and computes `WHR = waistCm / heightCm`, which reproduces the reference equation's WHR input exactly (confirmed by the reference baseline persons: F 79 cm / 150 cm = 0.5267; M 93 cm / 160 cm = 0.58125). The ×2.5 step is a UI unit-conversion shortcut, **not** part of the model.

### Model form
```
LP   = Σ (β_i · x_i)
risk = 1 − S0 ^ exp( LP − centeringMean )        (0 ≤ risk ≤ 1)
```
`S0 = 0.964588` (10-year baseline survival, v2.5 2021).
Guards (from reference): computed only when `age > 1` and `sbp ≥ 70`.

### PRIMARY non-lab equation (waist-to-height ratio) — ACTIVE
```
LP = 0.079·age + 0.128·sex + 0.019350987·sbp + 0.58454·diabetes
     + 3.512566·WHR + 0.459·smoker
risk = 1 − 0.964588 ^ exp( LP − 7.712325 )
```

### Fallback non-lab equation (waist circumference only, cm) — reserved, not active
```
LP = 0.08372·age + 0.05988·sex + 0.02034·sbp + 0.59953·diabetes
     + 0.01283·waistCm + 0.459·smoker
risk = 1 − 0.964588 ^ exp( LP − 7.31047 )
```

### Laboratory equation (documented for context — NOT implemented in this non-lab module)
```
LP = 0.08183·age + 0.39499·sex + 0.02084·sbp + 0.69974·diabetes
     + 0.00212·totalCholesterol + 0.41916·smoker
risk = 1 − 0.964588 ^ exp( LP − 7.04423 )
```

### No interaction / transformation terms
The model uses **linear terms only** — no age² , no interaction terms, no log/spline transformations. Sex differences enter **only** through the single `sex` indicator (β=0.128 non-lab). There are **no separate male/female equations** — one equation, sex as a covariate.

### Rounding & display behaviour
- Internal computation uses full floating-point precision.
- Percentage is displayed to **1 decimal**.
- Following the official convention, any risk **> 30%** is displayed as **"มากกว่า 30%"** rather than a specific number (`DISPLAY_CAP_PERCENT = 30` in `riskThresholds.js`).
- Risk bands (communication layer only): `<10%` low · `10–<20%` moderate · `20–≤30%` high · `>30%` very high.

### Reference "comparison person" (sanity anchors)
Female baseline: age 45, non-smoker, non-DM, SBP 115, WHR 0.52667 → **3.27%**.
Male baseline: age 45, non-smoker, non-DM, SBP 120, WHR 0.58125 → **4.91%**.
Both reproduced exactly by this module (see Golden Validation Set).
