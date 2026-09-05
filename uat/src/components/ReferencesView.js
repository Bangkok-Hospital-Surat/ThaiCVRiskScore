/** ReferencesView.js — audit page: sources, guidelines, model version, review date. */
import { REFERENCES, GUIDELINES, MODEL_META } from '../config/references.js';

export function ReferencesView() {
  const refs = REFERENCES.map(r => `
    <li>
      <span class="role">${r.role}</span><br>
      ${r.citation}
      ${r.url ? `<br><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.url}</a>` : ''}
      ${r.note ? `<br><span class="helper">${r.note}</span>` : ''}
    </li>`).join('');
  const guides = GUIDELINES.map(g => `<li>${g.label}<br><span class="helper">${g.note}</span></li>`).join('');

  return `
  <div class="card">
    <h2>หลักฐานและที่มาของแบบประเมิน</h2>
    <p>${MODEL_META.basisNote}</p>
    <p class="muted">โมเดล: <strong>${MODEL_META.equationSource}</strong><br>
      สถานะการตรวจสอบสมการ: <strong>${MODEL_META.equationStatus}</strong></p>

    <div class="result-section">
      <h3>นิยามผลลัพธ์และกลุ่มที่เหมาะสม</h3>
      <p>${MODEL_META.outcomeDefinition}</p>
      <p class="helper">ช่วงเวลาทำนาย: ${MODEL_META.predictionHorizonYears} ปี ·
        เหมาะสำหรับคนไทยอายุ ${MODEL_META.eligibleAgeRange.min}–${MODEL_META.eligibleAgeRange.max} ปี
        ที่ยังไม่เคยได้รับการวินิจฉัยโรคหลอดเลือดแดงแข็ง (primary prevention) ·
        กลุ่มประชากรที่ใช้พัฒนา: ${MODEL_META.derivationCohort}</p>
    </div>

    <div class="result-section">
      <h3>แหล่งอ้างอิงและการตรวจสอบ</h3>
      <ul class="refs">${refs}</ul>
    </div>

    <div class="result-section">
      <h3>แนวทางเวชปฏิบัติที่เกี่ยวข้อง</h3>
      <ul class="refs">${guides}</ul>
    </div>

    <div class="actions">
      <button class="secondary" data-action="back-from-refs">ย้อนกลับ</button>
    </div>
  </div>`;
}
