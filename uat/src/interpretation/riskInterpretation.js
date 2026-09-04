/**
 * riskInterpretation.js
 * Turns a raw risk fraction (from the engine) into plain-Thai meaning and a
 * category. This is a COMMUNICATION layer only — it never changes the number
 * and never prescribes treatment.
 */
import { bandForPercent, DISPLAY_CAP_PERCENT } from '../config/riskThresholds.js';

/**
 * @param {{riskFraction:number, riskPercent:number}} result  engine output
 * @returns {object} display-ready interpretation
 */
export function interpretRisk(result) {
  const pct = result.riskPercent;
  const band = bandForPercent(pct);

  const capped = pct > DISPLAY_CAP_PERCENT;
  const displayPercentText = capped
    ? `มากกว่า ${DISPLAY_CAP_PERCENT}`
    : pct.toFixed(1);

  // "n in 100" phrasing — round to nearest whole person, min 1 if pct rounds to 0 but >0.
  const perHundred = capped
    ? `มากกว่า ${DISPLAY_CAP_PERCENT}`
    : String(Math.max(pct >= 0.05 ? 1 : 0, Math.round(pct)));

  const headlineTh = 'ความเสี่ยงโรคหัวใจและหลอดเลือดใน 10 ปี';

  const meaningTh =
    `จากข้อมูลที่ท่านกรอก คนไทยที่มีลักษณะความเสี่ยงใกล้เคียงกันประมาณ ${perHundred} คนจาก 100 คน ` +
    `อาจเกิดโรคหัวใจหรือโรคหลอดเลือดสมองในช่วง 10 ปีข้างหน้า`;

  const meaningNoteTh =
    'ตัวเลขนี้เป็นค่าประมาณระดับประชากร (estimated population-level risk) ' +
    'ไม่ใช่คำทำนายที่แน่นอนสำหรับตัวบุคคล ผลจริงของแต่ละคนอาจมากหรือน้อยกว่านี้';

  return {
    riskPercent: pct,
    displayPercentText,      // e.g. "12.3" or "มากกว่า 30"
    displayCapped: capped,
    perHundred,
    band,                    // {key,labelTh,color,...}
    headlineTh,
    meaningTh,
    meaningNoteTh
  };
}
