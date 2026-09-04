# Project Handoff: HeartCheck Wise – Thai CV Risk Score Online

## 1. เป้าหมายโครงการ

พัฒนาแบบประเมินความเสี่ยงโรคหัวใจและหลอดเลือดสำหรับประชากรไทยแบบออนไลน์ โดยใช้ **Thai CV Risk Score – Non-Lab Model** เป็นแกนหลัก เพื่อให้ประชาชนสามารถประเมินความเสี่ยงได้โดย **ไม่ต้องใช้ผลตรวจเลือด**

แนวคิดคือทำ UX/UI และ interpretation ให้เข้าใจง่ายในลักษณะเดียวกับ HeartCheck Wise PREVENT แต่ **ห้ามนำ PREVENT equation หรือ cutoff มาปนกับ Thai CV Risk Score**

เป้าหมายสุดท้ายคือ web app ที่สามารถ deploy บน GitHub Pages และคำนวณทั้งหมดแบบ client-side เพื่อไม่ส่งข้อมูลสุขภาพของผู้ใช้ไปยัง server

## 2. Clinical Positioning

Thai CV Risk Score ควรเป็นโมเดลหลักสำหรับ Thai-first cardiovascular risk assessment เพราะเป็นโมเดลที่พัฒนาจากประชากรไทยและ guideline ไทยยังคงอ้างอิงใช้งาน

PREVENT ควรแยกเป็นอีก model/framework ไม่ควรนำค่าความเสี่ยงสองระบบมาเปรียบเทียบกันแบบ 1:1 เนื่องจาก:
- derivation population ต่างกัน
- outcome definition ต่างกัน
- calibration ต่างกัน
- treatment threshold ต่างกัน
- PREVENT ยังไม่มี Thai-specific external validation/recalibration ที่เพียงพอ

Architecture:
- HeartCheck Wise
  - Thai CV Risk Score
    - Non-Lab
    - Lab model ในอนาคต
  - PREVENT
    - แยกเป็นอีก pathway

## 3. Version แรกที่ต้องพัฒนา

**HeartCheck Wise – Thai CV Non-Lab**

ยังไม่ต้องทำ Thai CV Lab model ในรอบแรก

## 4. Input Variables

Thai CV Risk Score Non-Lab ควรใช้:
1. อายุ
2. เพศ
3. Smoking status
4. Diabetes status
5. Systolic Blood Pressure
6. Height
7. Waist circumference

สำคัญ:
**อย่า hard-code equation จนกว่าจะยืนยัน official/reference equation แล้ว**

## 5. Phase 1 — Equation Verification

ค้นหาและยืนยันสมการ Thai CV Risk Score Non-Lab จากแหล่งที่น่าเชื่อถือที่สุด โดยเรียง priority:
1. Original Thai cohort / derivation paper
2. Official Thai CV Risk calculator implementation
3. Ramathibodi / Mahidol implementation
4. Thai Ministry of Public Health
5. Royal College of Physicians of Thailand guideline
6. Peer-reviewed validation studies

ตรวจสอบ:
- variables
- coefficients
- baseline survival
- interaction terms
- transformation
- age range
- eligible population
- outcome definition
- follow-up horizon
- handling of diabetes
- handling of smoking
- handling of SBP
- waist/height calculation
- male/female equation differences

ห้าม copy equation จาก website ทั่วไปโดยไม่ cross-check

## 6. Golden Validation Set

ก่อนสร้าง production calculator ให้สร้าง Golden Validation Set อย่างน้อย 20–50 cases ครอบคลุม:
- Male/Female
- อายุช่วงต่ำ กลาง สูง
- smoker/non-smoker
- diabetic/non-diabetic
- SBP ต่ำ/กลาง/สูง
- รอบเอวต่ำ/สูง
- waist-height ratio หลายระดับ
- risk ต่ำ/กลาง/สูงมาก

แต่ละ case ต้องมี:
- Input
- Expected Thai CV Risk
- Reference source
- Calculator result
- Absolute difference
- Pass/Fail

ตั้ง tolerance ตาม precision ของ official/reference implementation

เป้าหมาย:
**calculator ทุก case ต้องผ่าน validation ก่อน deploy**

## 7. Safety / Eligibility Gate

Thai CV Risk Score เป็น primary prevention model

ไม่ควรใช้กับผู้ที่มี established cardiovascular disease เช่น:
- previous MI
- known coronary artery disease
- previous stroke/TIA
- known peripheral arterial disease
- previous coronary revascularization
- established ASCVD

หากมีโรคเหล่านี้:
ไม่ต้องแสดง risk percentage

ให้แสดงว่า:
“แบบประเมินนี้ออกแบบสำหรับผู้ที่ยังไม่มีโรคหัวใจและหลอดเลือดที่ได้รับการวินิจฉัย หากท่านเคยมีโรคดังกล่าว ควรรับการประเมินโดยแพทย์เพื่อวางแผน secondary prevention”

## 8. UX Structure

### Screen 1 — Introduction
หัวข้อ:
**ประเมินความเสี่ยงโรคหัวใจและหลอดเลือดใน 10 ปี**

คำอธิบาย:
ใช้ข้อมูลพื้นฐานโดยไม่ต้องใช้ผลเลือด

### Screen 2 — Eligibility
ถามเรื่อง:
- เคยเป็นโรคหัวใจขาดเลือดหรือไม่
- เคย stroke/TIA หรือไม่
- เคยมีหลอดเลือดแดงส่วนปลายตีบหรือไม่
- เคยทำ PCI/CABG หรือไม่

### Screen 3 — Risk Inputs
- Age
- Sex
- Smoking
- Diabetes
- SBP
- Height
- Waist circumference

## 9. Result Design

ผลลัพธ์เป็น 4 ชั้น:

### Layer 1 — Risk
ตัวเลขใหญ่:
**ความเสี่ยงโรคหัวใจและหลอดเลือดใน 10 ปี**
เช่น 12%

### Layer 2 — Meaning
ใช้ภาษาคน เช่น:
“จากข้อมูลที่คุณกรอก คนไทยที่มีลักษณะความเสี่ยงใกล้เคียงกันประมาณ 12 คนจาก 100 คน อาจเกิดโรคหัวใจหรือหลอดเลือดสมองในช่วง 10 ปีข้างหน้า”

ต้องระบุว่าเป็น estimated risk ไม่ใช่การทำนายรายบุคคลแบบแน่นอน

### Layer 3 — Risk Drivers
แสดง:
- ความดันโลหิตสูง
- สูบบุหรี่
- เบาหวาน
- รอบเอวสูง
- อายุ

ห้ามบอก contribution percentage ถ้า equation ไม่รองรับ

### Layer 4 — What To Do Next
คำแนะนำตาม risk factors เช่น:
- High SBP → วัดความดันซ้ำอย่างถูกต้อง และประเมิน hypertension
- Smoking → สนับสนุนการเลิกบุหรี่
- Diabetes → ติดตามน้ำตาลและควบคุมปัจจัยเสี่ยงร่วม
- Central obesity → weight management, exercise, dietary intervention

## 10. Risk Category

ให้ percentage เป็น primary result

ถ้าจะใช้สี/label:
- ใช้เป็น communication layer
- เก็บ threshold เป็น config
- ไม่ hard-code treatment recommendation จาก risk category โดยตรง

## 11. Clinical Disclaimer

“แบบประเมินนี้ใช้เพื่อช่วยประเมินความเสี่ยงเบื้องต้น ไม่ใช่การวินิจฉัยโรคหรือคำแนะนำการรักษา ผลการประเมินควรพิจารณาร่วมกับข้อมูลทางการแพทย์อื่นและคำแนะนำจากบุคลากรทางการแพทย์”

## 12. Privacy Architecture

ให้ calculation ทำทั้งหมด client-side

ไม่ส่ง:
- อายุ
- โรคประจำตัว
- ความดัน
- รอบเอว
- risk score

ออกจาก browser

ไม่ใช้ analytics ที่ capture health variables

## 13. Technical Architecture

/src
- calculator/
  - thaiCvNonLab.js
  - validationCases.js
- eligibility/
  - eligibilityRules.js
- interpretation/
  - riskInterpretation.js
  - recommendationRules.js
- config/
  - riskThresholds.js
  - references.js
- components/
  - InputForm
  - ResultCard
  - RiskDrivers
  - RecommendationCard
  - Disclaimer

## 14. Separation of Concerns

แยก:
- Equation Engine
- Interpretation Engine
- UI

เพื่อให้ update equation/recalibration ภายหลังได้โดยไม่ต้อง rewrite app

## 15. Future-proofing

เตรียม architecture สำหรับ:
- Thai CV Non-Lab
- Thai CV Lab
- PREVENT
- Thai recalibrated PREVENT
- National Thai CVD Risk Score ใหม่

แนะนำ model registry เช่น riskModels.js

Version แรก activate แค่ Thai CV Non-Lab

## 16. References Page

มีหน้า:
**หลักฐานและที่มาของแบบประเมิน**

แสดง:
- Original Thai CV Risk Score paper
- Validation studies
- Thai cardiovascular guidelines
- RCPT Dyslipidemia guideline
- Thai Hypertension guideline
- Official Thai CV Risk implementation หากพบ

พร้อม:
- Model version
- Last reviewed date

## 17. Version Control

Footer:
HeartCheck Wise
Thai CV Risk Score – Non-Lab
Model Version X.X
Clinical Review Date

## 18. Release Gates

ห้าม Production Deploy หากยังไม่ผ่าน:
1. Equation verified
2. Golden Validation Set passed
3. Clinical eligibility rules reviewed
4. Interpretation wording reviewed
5. Privacy review
6. Mobile usability test
7. Clinical sign-off

## 19. สิ่งที่ต้องทำต่อทันที

1. Deep research เพื่อ identify official Thai CV Risk Score Non-Lab equation
2. Cross-check equation อย่างน้อย 2 independent authoritative sources
3. Document complete mathematical equation
4. Identify official/reference calculator
5. สร้าง Golden Validation Set
6. Implement calculator engine
7. Run validation tests
8. สร้าง interpretation engine
9. สร้าง UI
10. Deploy UAT ก่อน production

## 20. Critical Instruction

ห้าม:
- เดาสมการ
- invent coefficients
- copy equation จาก calculator ที่ไม่ทราบที่มา
- ใช้ PREVENT coefficients แทน
- ใช้ risk category เป็น treatment recommendation โดยตรง
- deploy production ก่อน validation
- ส่งข้อมูล health input ไป backend โดยไม่จำเป็น

หาก official equation ยังไม่สามารถยืนยันได้:
**หยุดที่ research/validation phase และรายงานช่องว่าง**
อย่าสร้าง calculator ที่อาจให้ risk ผิด

## Definition of Done

Version 1 พร้อมใช้งานเมื่อ:
- Thai CV Non-Lab equation verified
- ≥20–50 Golden cases validated
- calculator results reproduce reference implementation
- eligibility gate ทำงาน
- result interpretation เป็นภาษาไทยเข้าใจง่าย
- client-side only
- responsive mobile-first UI
- references visible
- disclaimer visible
- UAT ผ่าน
- clinical reviewer approve

Working project name:
**HeartCheck Wise – Thai CV**

Tagline:
**รู้ความเสี่ยงหัวใจของคุณ โดยไม่ต้องรอผลเลือด**
