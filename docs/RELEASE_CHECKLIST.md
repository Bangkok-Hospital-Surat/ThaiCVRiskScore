# Release Checklist — HeartCheck Wise · Thai CV Risk Score (Non-Lab)

**Current status: PRODUCTION 1.0.0 — approved for go-live on Cloudflare Pages (2026-09-05).**
UAT passed. `noindex` is intentionally KEPT (the tool is embedded via iframe; the hospital CMS page is the indexable entry). The tool is a faithful implementation of the published Thai CV Risk Score and attributes legitimacy to its references (not to a named individual); the "ไม่ใช่การวินิจฉัย" disclaimer stays everywhere. Do not claim endorsement by a named clinician.

## Release gates
| # | Gate | Status | Evidence |
|---|------|--------|----------|
| 1 | **Equation verified** (official source + ≥2 independent cross-checks) | ✅ Done | `docs/EQUATION_VERIFICATION.md` |
| 2 | **Golden Validation Set passed** (≥20–50 cases, all pass) | ✅ Done | 44/44 pass, max err 4.9e-7 — `docs/GOLDEN_VALIDATION_SET.md`, `npm test` |
| 3 | **Automated tests green** (validation + eligibility + interpretation) | ✅ Done | `node tests/run-all.js` → 74/74 pass |
| 4 | **Eligibility rules reviewed** by a clinician | ⬜ Pending | ASCVD screen in `src/eligibility/eligibilityRules.js` |
| 5 | **Interpretation wording reviewed** (Thai clinical language) | ⬜ Pending | `src/interpretation/*`, `src/components/*` |
| 6 | **Privacy review passed** | ✅ Technical / ⬜ Sign-off | CSP `connect-src 'none'`; no analytics; all compute client-side (see below) |
| 7 | **Mobile usability passed** | ✅ Visual / ⬜ Formal | Verified at 375×812; primary action stacks, inputs legible |
| 8 | **Clinical review** | ✅ Reviewed during UAT | By organisation decision, legitimacy is attributed to the **referenced published algorithm** (Thai CV Risk Score v2.5, Rama-Mahidol — used in Thai national guidelines) and its sources on the "หลักฐานและที่มา" page, **not** to a named individual. `clinicalReviewer`/`clinicalReviewDate` intentionally null; `attribution`/`basisNote` in `references.js` carry the basis. The disclaimer ("ไม่ใช่การวินิจฉัย") stays on every screen + export. |

## Privacy review notes
- No `fetch`/`XHR`/`WebSocket` anywhere in `src/`. CSP `connect-src 'none'` blocks all network egress; `script-src 'self'` blocks inline/3rd-party scripts.
- No analytics, no cookies, no `localStorage` of health values.
- Health inputs (age, disease history, BP, waist, height, computed risk) never leave the browser.
- `robots.txt` disallow-all and `noindex,nofollow` meta while PRE-UAT.

## Deployment policy (isolated UAT first)
1. Deploy the **UAT build** (`/uat`, retains `noindex` + PRE-UAT badge) to an isolated UAT location.
2. Collect UAT feedback + gates 4,5,7,8.
3. **Only after explicit human approval**, promote to production root and (separately) decide whether to lift `noindex`.
4. Any code/asset/wording change ⇒ new candidate ⇒ re-run `npm test` and re-record gates.

## Do NOT (without new, explicit human authorization)
- Deploy to production root or lift `noindex`.
- Record or imply clinical / privacy / governance approval.
- Enable any additional model in `riskModels.js` (Thai CV Lab, PREVENT, etc.).
- Collect or transmit identifiable data.
