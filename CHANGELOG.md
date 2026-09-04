# Changelog — HeartCheck Wise · Thai CV Risk Score (Non-Lab)

## 1.0.0-uat.1 — 2026-09-04 (PRE-UAT candidate)
- Phase 1 equation verification complete: Thai CV Risk Score v2.5 (Rama-Mahidol, 2021)
  non-lab (waist-to-height) model. Coefficients cross-checked against 2 independent
  authoritative sources (official Rama calculator + Thai MoPH HDC "43-file" standard).
- Golden Validation Set: 44 synthetic cases, all pass vs reference implementation
  (max abs error 4.9e-7). Automated suites: 74/74 pass.
- Independent calculator engine, ASCVD eligibility safety gate, Thai interpretation +
  recommendation engine, references/audit page, 4-layer result UX.
- Client-side only; CSP connect-src 'none'; noindex; PRE-UAT badge.
- Isolated UAT build under /uat. Production = NO-GO pending clinical sign-off.
