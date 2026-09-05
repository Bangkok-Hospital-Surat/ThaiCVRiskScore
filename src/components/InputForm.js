/** InputForm.js — Screen 2 (eligibility) and Screen 3 (risk inputs). */
import { ASCVD_CONDITIONS, INPUT_LIMITS } from '../eligibility/eligibilityRules.js';

export function EligibilityForm() {
  const checks = ASCVD_CONDITIONS.map(c => `
    <label><input type="checkbox" data-elig="${c.key}"> <span>${c.labelTh}</span></label>`).join('');
  return `
  <div class="card safety-card">
    <h2>ขั้นที่ 1 · คัดกรองความเหมาะสม</h2>
    <p class="muted">แบบประเมินนี้สำหรับผู้ที่ <strong>ยังไม่เคยได้รับการวินิจฉัย</strong> ว่าเป็นโรคหัวใจและหลอดเลือด</p>
    <p class="section-label">หากท่านเคยมีภาวะเหล่านี้ กรุณาเลือก:</p>
    <div class="checks">${checks}</div>
    <div class="elig-or">— หรือ —</div>
    <div class="checks">
      <label class="none-option"><input type="checkbox" id="elig-none"> <span>ฉันไม่เคยมีประวัติโรคตามรายการข้างต้น</span></label>
    </div>
    <div class="actions">
      <button class="secondary" data-action="to-intro">ย้อนกลับ</button>
      <button class="primary" data-action="to-inputs" disabled>ถัดไป</button>
    </div>
  </div>`;
}

export function RiskInputForm() {
  const L = INPUT_LIMITS;
  return `
  <div class="card data-card">
    <h2>ขั้นที่ 2 · ข้อมูลสำหรับประเมิน</h2>
    <p class="muted">ไม่ต้องใช้ผลเลือด ใช้เพียงข้อมูลพื้นฐานเท่านั้น</p>
    <div class="grid">
      <div>
        <label class="field" for="in-age">อายุ (${L.age.min}–${L.age.max} ปี)</label>
        <input id="in-age" type="number" inputmode="numeric" min="${L.age.min}" max="${L.age.max}" placeholder="เช่น 55">
        <span class="field-error" data-err="age" hidden></span>
      </div>
      <div>
        <label class="field">เพศ</label>
        <div class="seg" data-seg="sex">
          <label data-val="male"><input type="radio" name="sex" value="male">ชาย</label>
          <label data-val="female"><input type="radio" name="sex" value="female">หญิง</label>
        </div>
        <span class="field-error" data-err="sex" hidden></span>
      </div>
      <div>
        <label class="field">สูบบุหรี่ในปัจจุบัน</label>
        <div class="seg" data-seg="smoke">
          <label data-val="1"><input type="radio" name="smoke" value="1">สูบ</label>
          <label data-val="0"><input type="radio" name="smoke" value="0">ไม่สูบ</label>
        </div>
      </div>
      <div>
        <label class="field">เป็นเบาหวาน</label>
        <div class="seg" data-seg="dm">
          <label data-val="1"><input type="radio" name="dm" value="1">เป็น</label>
          <label data-val="0"><input type="radio" name="dm" value="0">ไม่เป็น</label>
        </div>
      </div>
      <div>
        <label class="field" for="in-sbp">ความดันโลหิตตัวบน (SBP)</label>
        <input id="in-sbp" type="number" inputmode="numeric" min="${L.sbp.min}" max="${L.sbp.max}" placeholder="mmHg เช่น 130">
        <span class="helper">วัดขณะพักอย่างถูกวิธี หน่วย mmHg</span>
        <span class="field-error" data-err="sbp" hidden></span>
      </div>
      <div>
        <label class="field" for="in-waist">รอบเอว</label>
        <input id="in-waist" type="number" inputmode="decimal" min="${L.waistCm.min}" max="${L.waistCm.max}" placeholder="เซนติเมตร เช่น 88">
        <span class="helper">วัดที่ระดับสะดือ หน่วยเซนติเมตร</span>
        <span class="field-error" data-err="waistCm" hidden></span>
      </div>
      <div>
        <label class="field" for="in-height">ส่วนสูง</label>
        <input id="in-height" type="number" inputmode="decimal" min="${L.heightCm.min}" max="${L.heightCm.max}" placeholder="เซนติเมตร เช่น 165">
        <span class="field-error" data-err="heightCm" hidden></span>
      </div>
    </div>
    <div class="actions">
      <button class="secondary" data-action="to-eligibility">ย้อนกลับ</button>
      <button class="primary" data-action="calculate">ประเมินความเสี่ยง</button>
    </div>
  </div>`;
}
