# Changelog — HeartCheck Wise · Thai CV Risk Score (Non-Lab)

## 1.0.0 — 2026-09-05 (Production)
- UAT passed. Promoted to production for go-live on Cloudflare Pages.
- Removed PRE-UAT marking (title, header badge, exported-card corner, footer).
- Legitimacy attributed to the referenced published algorithm (Thai CV Risk
  Score v2.5, Rama-Mahidol) and the "หลักฐานและที่มา" page — no named-individual
  sign-off recorded (organisation decision). `clinicalReviewer`/`Date` stay null;
  new `attribution` + `basisNote` power the footer/export/references line.
- Header badge now reads "เครื่องมือคัดกรอง · ไม่ใช่การวินิจฉัย"; disclaimer kept everywhere.
- `noindex` intentionally kept (tool is iframe-embedded on the hospital site).

## 1.0.0-uat.1 — 2026-09-04 (PRE-UAT candidate)
- Equation verified (Thai CV Risk Score v2.5, non-lab WHR); 44/44 golden pass.
- Independent engine, ASCVD safety gate, Thai interpretation/recommendation,
  references page, 4-layer result UX. Client-side only; CSP connect-src 'none'.
- Export: PNG (Web Share/LINE or download) + client-side PDF; hospital footer
  banner; short ">30%" capped display; iframe auto-resize (postMessage).
