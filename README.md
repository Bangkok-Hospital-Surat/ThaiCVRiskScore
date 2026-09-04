# HeartCheck Wise – Thai CV Risk Score (Non-Lab)

> รู้ความเสี่ยงหัวใจของคุณ โดยไม่ต้องรอผลเลือด

A **client-side**, **Thai-first** web app that estimates **10-year cardiovascular (ASCVD) risk**
for Thai adults **without any laboratory values**, using the official
**Thai CV Risk Score v2.5 (Rama-Mahidol, 2021)** non-laboratory (waist-to-height) equation.

**Status:** PRE-UAT candidate — **not for clinical use yet.** Production = NO-GO until the
release gates are met (`docs/RELEASE_CHECKLIST.md`).

## Why it is safe & auditable
- **Equation is verified, not invented.** Coefficients cross-checked against two independent
  authoritative sources; validated to reproduce the official reference implementation to 4.9e-7
  across 44 golden cases. See `docs/EQUATION_VERIFICATION.md` and `docs/GOLDEN_VALIDATION_SET.md`.
- **Primary-prevention safety gate.** Established-ASCVD users get **no score** and a referral message.
- **Privacy by design.** All computation runs in the browser; CSP `connect-src 'none'` blocks any
  network egress; no analytics; no health data stored or transmitted.
- **Strict separation of concerns.** Equation engine ⟂ interpretation ⟂ UI.

## Architecture
```
src/
  calculator/    thaiCvNonLab.js (engine) · validationCases.js (golden set) · riskModels.js (registry)
  eligibility/   eligibilityRules.js (ASCVD gate + input ranges)
  interpretation/ riskInterpretation.js · recommendationRules.js
  config/        riskThresholds.js (bands) · references.js (sources + version)
  components/    InputForm · ResultCard · RiskDrivers · RecommendationCard · Disclaimer · ReferencesView
  app/           main.js (view controller)
docs/            EQUATION_VERIFICATION.md · GOLDEN_VALIDATION_SET.md · RELEASE_CHECKLIST.md · reference-formular.js
tests/           validation · eligibility · interpretation · run-all
uat/             isolated UAT build
```
Only the **Thai CV Non-Lab** model is enabled. Thai CV Lab, PREVENT, Thai-recalibrated PREVENT
and a future National Thai CVD score are reserved (disabled) placeholders in the registry.

## Run locally
```bash
npm test              # 74/74 checks (validation 44 + eligibility 11 + interpretation 19)
npm run serve         # static server at http://localhost:4178  (ES modules need HTTP, not file://)
```
Deployable as static files on GitHub Pages (`.nojekyll` present).

## Result UX (4 layers)
A. **Risk** — large 10-year percentage · B. **Meaning** — plain-Thai "n in 100", labelled as
population-level estimate · C. **Risk drivers** — factors to watch (no fabricated % contributions)
· D. **What to do next** — general preventive guidance (not prescribing).

## Not this
Not a diagnosis, not treatment advice, not a PREVENT calculator, and **not interchangeable**
with PREVENT (different cohort, outcome, calibration and thresholds).
