# สรุปโปรเจกต์ HeartCheck Wise – Thai CV Risk Score (Non-Lab)
### เอกสารส่งต่อ (handoff) เพื่อนำแนวทางไปทำต่อกับ PREVENT · ปรับปรุง 5 ก.ย. 2569

---

## 1. ภาพรวม
เครื่องมือประเมินความเสี่ยงโรคหัวใจและหลอดเลือดใน 10 ปี สำหรับคนไทย **โดยไม่ต้องเจาะเลือด** ทำงานฝั่ง client ทั้งหมด (ไม่มี backend) เป็น static site

- **Production URL:** https://thaicvriskscore.pages.dev/ (Cloudflare Pages)
- **Repo:** https://github.com/Bangkok-Hospital-Surat/ThaiCVRiskScore (org ของ รพ.)
- **สถานะ:** Production v1.0.0 · UAT ผ่านโดยแพทย์ · deploy แล้ว

---

## 2. สมการ + การตรวจสอบ (สำคัญที่สุด — ทำ research ก่อน code)
- **สมการ:** Thai CV Risk Score **v2.5 (Rama-Mahidol, 2021)** แบบ non-lab (waist-to-height)
  `LP = 0.079·age + 0.128·sex(M=1) + 0.019350987·SBP + 0.58454·DM + 3.512566·WHR + 0.459·smoke`
  `risk = 1 − 0.964588^exp(LP − 7.712325)` · WHR = waist_cm / height_cm
- **Verify:** cross-check coefficients กับ 2 แหล่งอิสระ — official Rama `formular.js` + Thai MoPH HDC "43-file" (2018) → βs ตรงกันทั้งคู่
- **Golden Validation Set:** 44 เคส สร้างจากสมการ reference → engine reproduce ได้ error สูงสุด 4.9e-7 · ทุกเคสผ่าน
- เอกสาร: `docs/EQUATION_VERIFICATION.md`, `docs/GOLDEN_VALIDATION_SET.md`
- **หลักการ:** อย่าเดา/hard-code สมการ — ต้อง verify จากแหล่งทางการก่อน ถ้า verify ไม่ได้ให้หยุดและรายงาน

---

## 3. สถาปัตยกรรม (แยก concern ชัดเจน)
```
src/
  calculator/   thaiCvNonLab.js (engine) · validationCases.js (golden) · riskModels.js (registry)
  eligibility/  eligibilityRules.js (ASCVD gate + ช่วงค่า input)
  interpretation/ riskInterpretation.js · recommendationRules.js
  config/       riskThresholds.js (แถบสี/หมวด) · references.js (แหล่งอ้างอิง + version)
  components/   InputForm · ResultCard · RiskDrivers · RecommendationCard · Disclaimer · ReferencesView
  app/          main.js (view controller) · exportSummary.js (PNG/PDF export)
docs/           รายงาน verify/validation, RELEASE_CHECKLIST, DEPLOY_CLOUDFLARE, คู่มือฝังเว็บ
tests/          validation (44) · eligibility · interpretation · run-all → 74/74 pass
_headers        security headers สำหรับ Cloudflare/Netlify
```
**engine ⟂ interpretation ⟂ UI** — แก้สมการ/recalibrate ได้โดยไม่ต้อง rewrite UI

---

## 4. ฟีเจอร์หลัก
- **Safety gate (ASCVD):** ถ้าเคยมีโรคหัวใจ/หลอดเลือด → ไม่แสดง % แต่แสดงข้อความส่งต่อแพทย์
  - เพิ่มตัวเลือกล่างสุด **"ฉันไม่เคยมีประวัติโรคตามรายการข้างต้น"** (สีเขียว) + ปุ่ม "ถัดไป" ปิดจนกว่าจะเลือก + กันเลือกขัดกัน
- **ผลลัพธ์ 4 ชั้น:** (A) % ใหญ่ (B) ความหมายภาษาคน "n คนจาก 100" (C) ปัจจัยเสี่ยง (D) คำแนะนำ
- **แถบสี/หมวด** = communication layer (config แยกจาก engine ไม่ hard-code การรักษา)
- **Export:** 📷 บันทึก/แชร์รูป (PNG) → Web Share (LINE บนมือถือ) หรือ download · 📄 บันทึก/แชร์ PDF (วาด card เป็น JPEG ฝังใน PDF, ไม่ใช้ window.print) — ทั้งคู่วาดด้วย canvas ในเครื่อง ไม่ใช้ library ภายนอก (CSP-safe)
- **แบนเนอร์โรงพยาบาล** ท้ายรายงาน (screen + รูป + PDF) — `assets/bsr-footer-banner.jpg`
- **iframe auto-resize** ผ่าน postMessage type `bsr-thaicv-height` (สำหรับฝังบนเว็บ รพ.)
- **หน้า "หลักฐานและที่มา"** — แสดงแหล่งอ้างอิงทั้งหมด

---

## 5. ความเป็นส่วนตัว / ความปลอดภัย
- คำนวณทั้งหมดในเบราว์เซอร์ · **ไม่ส่ง/เก็บข้อมูลสุขภาพไป server** · ไม่มี analytics เก็บค่าที่กรอก
- CSP `connect-src 'none'` (บล็อกการส่งข้อมูลออก) · `script-src 'self'` (ไม่มี inline script)
- `noindex` + robots disallow (คงไว้แม้ production เพราะฝัง iframe หน้า CMS เป็นตัวที่ให้ค้นเจอ)
- บน Cloudflare: `_headers` ตั้ง **`frame-ancestors 'self' bangkokhospital.com`** (ฝังได้เฉพาะเว็บ รพ.) + **`Cache-Control: no-cache`** (ทุกเครื่องได้เวอร์ชันล่าสุด ไม่มีแคชค้าง)

---

## 6. Production status
- **Version 1.0.0** · เอาป้าย PRE-UAT ออกแล้ว · badge หัวเว็บ = "เครื่องมือคัดกรอง · ไม่ใช่การวินิจฉัย"
- **การรับรอง:** UAT ผ่านโดยแพทย์ แต่ **ไม่บันทึกชื่อผู้รับรอง** (โดยเลือกของ รพ.) — ให้เครดิตที่ **แหล่งอ้างอิง** (algorithm Rama v2.5) ผ่าน `attribution` + `basisNote` ใน `references.js` แทน · disclaimer "ไม่ใช่การวินิจฉัย" คงทุกจุด

---

## 7. Deploy flow + git
- Repo อยู่ใต้ **org Bangkok-Hospital-Surat** (โอนมาจากบัญชีบุคคล BSR1719 — BSR1719 เป็น Owner ของ org จึง push ได้)
- **Cloudflare Pages** auto-deploy ทุกครั้งที่ push `main` (Framework None, build command ว่าง, output = root/empty)
- Cloudflare account: `Bangkokhospitalsurat@gmail.com` · project `thaicvriskscore`
- **GitHub Pages ปิดแล้ว** (Settings → Pages → Source: None)
- ⚠️ **บทเรียน:** push ขึ้น repo อย่างเดียว "เว็บยังไม่อัปเดต" — Cloudflare build ~20 วิ (สมัย GitHub Pages ต้อง Run workflow เอง)

---

## 8. การฝัง iframe บนเว็บ รพ.
- คู่มือแอดมิน: `docs/คู่มือฝังเว็บ-สำหรับแอดมิน.md` และ `.docx`
- โค้ด iframe: `src="https://thaicvriskscore.pages.dev/"`, message type `bsr-thaicv-height`, id `bsrThaiCV`
- วางในโหมด **Text** ของ CMS แล้ว **Publish ทันที** (ห้ามสลับ Visual — script โดนลบ) · กรอก **Excerpt** เสมอ · **LINE ไม่มีล้างแคช** (รอ 1-3 วัน)
- ถ้าเฟรมว่าง → แจ้ง BDMS เพิ่ม host ใน frame-src

---

## 9. บทเรียน / gotchas สำคัญ (นำไปใช้กับ PREVENT ได้)
1. **Research สมการก่อน code** — verify จาก 2 แหล่ง + golden validation set ก่อนสร้าง UI
2. **แยก engine/interpretation/UI** — แก้ทีหลังง่าย
3. **window.print() ใช้ไม่ได้ในเบราว์เซอร์ LINE/มือถือ** → สร้าง PDF เป็นไฟล์จริง (canvas→JPEG→PDF)
4. **iOS Web Share:** ส่ง `files` อย่างเดียว อย่าใส่ `text`/`title` (ไม่งั้นได้ไฟล์ text ส่วนเกิน)
5. **ข้อความยาวใน canvas ล้นกล่อง** → ใช้ short form (เช่น ">30%") + auto-fit ฟอนต์
6. **Cache:** Cloudflare `no-cache` แก้ปัญหาแคชค้าง (GitHub Pages ตั้ง header เองไม่ได้)
7. **frame-ancestors** ล็อกการฝัง (GitHub Pages ทำไม่ได้ → ใช้ Cloudflare/Netlify)
8. **repo ของ รพ. ควรอยู่ใน org** ไม่ใช่บัญชีบุคคล (institutional ownership)
9. **บัญชีบุคคล ≠ org** (bangkokhospitalsurat vs Bangkok-Hospital-Surat) — repo อยู่ใน **org**

---

## 10. งานที่เหลือ (Thai CV)
- ฝัง iframe บนหน้า CMS รพ. จริง + ทำ QR (ชี้ URL รพ. เท่านั้น)
- (ตัวเลือก) custom domain บน Cloudflare

---
---

## 11. 📋 PROMPT สำหรับเปิด session พัฒนา PREVENT ต่อ (คัดลอกไปวาง)

```
พัฒนาโปรเจกต์ HeartCheck Wise – PREVENT (v2.3) ต่อ

บริบท:
- Local repo: D:\heartcheck-wise (remote github.com/BSR1719/heartcheck-wise, org AHA-DS-Analytics)
- Working branch: prevent-v2-working-prototype · มี Draft PR #3 เข้า main
- Locked UAT candidate SHA: 9d4122bd0267f7f4fc2848efcf766a2391543329
- เป็นแบบประเมินความเสี่ยง CV ด้วย AHA PREVENT · client-side ล้วน ไม่มี backend
- Git identity ของ repo นี้: BSR1719 <chinnawat.bsr@gmail.com>
- เอกสาร handoff: D:\PREVENT\HeartCheck_Wise_Claude_Handoff_2026-09-03.md

⚠️ GOVERNANCE เข้มงวด (ยึดตามนี้เสมอ):
- Production = NO-GO · ทุกอย่างยัง PRE-UAT
- ห้ามทำโดยไม่ได้รับอนุญาตใหม่: merge PR#3 / mark Ready / push หรือ deploy ขึ้น main /
  เอา PRE-UAT/noindex ออก / force-push/rebase / บันทึกการรับรองทางคลินิก / เก็บข้อมูลผู้ป่วย
- การแก้โค้ดใด ๆ = candidate SHA ใหม่ + ต้องรันเทสต์/gate ใหม่ (candidate ที่ล็อก 9d4122bd จะเปลี่ยน)
- ก่อน GitHub write ทุกครั้ง: re-fetch → ยืนยัน remote head = parent ที่คาด → fast-forward/non-force เท่านั้น → mismatch ให้หยุด+รายงาน
- ทำงานบน branch prevent-v2-working-prototype เท่านั้น ไม่แตะ main/PR#3
- อย่ากล่าวหรือสื่อว่าผ่านการรับรอง production/clinical

งานที่อยากทำ (นำแนวทางจาก Thai CV Risk Score มาปรับใช้ — ดูสรุปที่
D:\Thai CV risk score\สรุปโปรเจกต์-ThaiCV-สำหรับ-PREVENT.md):
[ ระบุงานที่ต้องการ เช่น ]
- เพิ่มปุ่ม Export: บันทึก/แชร์รูป (PNG, Web Share→LINE) + PDF (canvas→JPEG→PDF, ไม่ใช้ window.print)
- เพิ่มแบนเนอร์โรงพยาบาลท้ายรายงาน (screen + รูป + PDF)
- เพิ่ม iframe auto-resize (postMessage) สำหรับฝังบนเว็บ รพ.
- เพิ่มตัวเลือก eligibility "ไม่มีประวัติข้างต้น" + ปุ่มถัดไป disabled จนเลือก
- เตรียมย้าย repo เข้า org Bangkok-Hospital-Surat + deploy บน Cloudflare Pages
  (_headers: frame-ancestors ล็อก bangkokhospital.com + Cache-Control no-cache)

ก่อนเริ่ม: อ่าน handoff + สรุป Thai CV, ตรวจสถานะ repo (branch/PR/working tree/candidate SHA),
แล้วเสนอแผน + ยืนยันกับผมก่อน commit/push ทุกครั้ง (แจ้งด้วยว่าการแก้จะสร้าง candidate SHA ใหม่)
```
```
(แก้ส่วน "งานที่อยากทำ" ให้ตรงกับสิ่งที่ต้องการก่อนใช้)
```
