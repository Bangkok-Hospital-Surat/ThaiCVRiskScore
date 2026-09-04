# Deploy on Cloudflare Pages + Go-Live on the Hospital Website

HeartCheck Wise – Thai CV Risk Score (Non-Lab). This guide covers hosting the
tool on **Cloudflare Pages** (so we can lock who may embed it) and the exact
steps to embed it on the hospital website **after UAT + clinical sign-off**.

> The repo `_headers` file works on **both Cloudflare Pages and Netlify** (both
> read it). GitHub Pages ignores it — that is why the `frame-ancestors` lock only
> takes effect on Cloudflare/Netlify.

---

## PART A — Host on Cloudflare Pages (can do during UAT)

### A1. Connect the repo
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize GitHub, pick repo **BSR1719/ThaiCVRiskScore**, branch **main**.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty — it's static)*
   - **Build output directory:** `/`  (repo root)
4. **Save and Deploy.** First build takes ~1 min. You get a URL like
   `https://thaicvriskscore.pages.dev/`.

> Every push to `main` auto-deploys. To keep production stable, you can later set
> a specific production branch or use Cloudflare's deploy controls.

### A2. Verify the security headers
Open a terminal (or browser devtools → Network → the document → Response Headers):
```bash
curl -sI https://thaicvriskscore.pages.dev/ | grep -iE "content-security-policy|x-content-type|referrer-policy|permissions-policy"
```
You must see `content-security-policy: frame-ancestors 'self' https://www.bangkokhospital.com ...`.

### A3. (Optional) Custom domain
Pages → your project → **Custom domains** → add e.g. `heartcheck.<yourdomain>`.
Cloudflare provisions TLS automatically. Update the iframe `src` (Part B) to match.

### A4. (Recommended for production) Lock down the source
- To stop others copying the code and hosting an unbranded clone, make the repo
  **Private** (Cloudflare Pages deploys from private repos fine).
- After go-live on Cloudflare, **turn OFF GitHub Pages** (repo → Settings → Pages
  → Source: **None**) so there is no second, unprotected, embeddable URL.

---

## PART B — Go-Live on the Hospital Website (ONLY after the gates below)

### B0. 🔴 Release gates — do NOT start Part B until ALL are true
- [ ] **Clinical sign-off obtained** — a named clinician approved the equation,
      eligibility rules and wording. Recorded in `src/config/references.js`
      (`clinicalReviewer`, `clinicalReviewDate`).
- [ ] Golden validation still passing (`npm test` → all pass).
- [ ] Eligibility + interpretation wording reviewed.
- [ ] Privacy review signed off.
- [ ] Mobile usability confirmed on real iPhone + Android.
- [ ] The person doing this has **Administrator/Editor** rights in the BDMS B+ CMS.

See `docs/RELEASE_CHECKLIST.md`. Until every box is ticked, production stays **NO-GO**
and the tool keeps its `noindex` + PRE-UAT marking.

### B1. Turn the candidate into a production build (code change, gated)
Once sign-off is recorded, a maintainer makes a **production commit** that:
1. Sets `clinicalReviewDate` + `clinicalReviewer` in `src/config/references.js`.
2. Removes the **PRE-UAT** badge (`index.html` header) and the footer "PRE-UAT" wording.
3. Decides on indexing: remove `noindex,nofollow` from `index.html` and relax
   `robots.txt` **only if** the page should be search-indexable.
4. Bumps the model/app version and re-runs `npm test`.
This becomes the new production candidate SHA. Re-deploy on Cloudflare (auto on push).

> This step is intentionally manual and gated — it must not happen as a side effect.

### B2. Create the hospital page (BDMS B+ CMS / WordPress)
Per the hospital embed playbook:
- Choose a short **English slug** (decide before making the QR — changing it later
  breaks printed QRs). URL: `https://www.bangkokhospital.com/th/surat/content/{{slug}}`.
- Fill **Title** (Thai), **Excerpt** (1–2 sentences, ~150 chars — never leave blank),
  **Slug**, **Meta Description**.

### B3. Paste the embed code (in **Text** mode, then Publish immediately)
Put a Thai description paragraph above the iframe, then this block. **Do not switch
back to Visual before Publish** (TinyMCE silently strips `<script>`).

```html
<h2 style="text-align:center">ประเมินความเสี่ยงโรคหัวใจและหลอดเลือดใน 10 ปี</h2>
<p style="text-align:center">รู้ความเสี่ยงหัวใจของคุณ โดยไม่ต้องรอผลเลือด ใช้เวลาประมาณ 1–2 นาที</p>
<p style="text-align:center">สำหรับผู้ที่ยังไม่เคยได้รับการวินิจฉัยโรคหัวใจและหลอดเลือด อายุ 35–70 ปี</p>

<div style="max-width:820px;margin:0 auto;">
  <iframe id="bsrThaiCV"
          src="https://thaicvriskscore.pages.dev/"
          style="width:100%;border:none;height:1800px;display:block;"
          scrolling="no"
          title="ประเมินความเสี่ยงโรคหัวใจและหลอดเลือดใน 10 ปี (ไม่ใช้ผลเลือด)"></iframe>
</div>
<script>
window.addEventListener('message', function(e){
  if (e.data && e.data.type === 'bsr-thaicv-height') {
    var f = document.getElementById('bsrThaiCV');
    if (f) f.style.height = (e.data.height + 20) + 'px';
  }
});
</script>
```
Change `src` to your custom domain if you set one in A3. The auto-resize `type`
(`bsr-thaicv-height`) already matches the app — do not change it.

### B4. If the tool shows a blank frame
The hospital site's own CSP may block external frames. Ask the **central BDMS team**
to add your host (`thaicvriskscore.pages.dev` or your custom domain) to their
`frame-src` allow-list. (Netlify/`github.io` were not blocked previously.)

### B5. Clear caches before publicising
- **CMS (BDMS):** wait ~15 min.
- **Facebook:** developers.facebook.com/tools/debug → Scrape Again.
- **LINE:** 🔴 no cache purge — wait 1–3 days. Finish the page BEFORE posting on LINE.

### B6. QR code (make LAST, from the hospital URL only)
- Point the QR at `https://www.bangkokhospital.com/th/surat/content/{{slug}}` — **never**
  the pages.dev/github.io URL directly.
- Use **static** QR (no dynamic/shortener). Test-scan on iPhone + Android, printed, in low light.

---

## Quick reference
| Item | Value |
|---|---|
| Repo | BSR1719/ThaiCVRiskScore |
| Cloudflare URL (example) | https://thaicvriskscore.pages.dev/ |
| iframe auto-resize type | `bsr-thaicv-height` |
| Embed allow-list (in `_headers`) | `www.bangkokhospital.com`, `bangkokhospital.com` |
| Current status | PRE-UAT · Production **NO-GO** until B0 gates pass |
