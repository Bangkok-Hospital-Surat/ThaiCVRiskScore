/**
 * eligibilityRules.js
 * Safety gate for a PRIMARY-PREVENTION tool.
 *
 * Two responsibilities, kept separate from the equation:
 *   1. ASCVD exclusion — users with established cardiovascular disease must NOT
 *      receive a primary-prevention risk percentage.
 *   2. Input-range checks — age must be within the validated range; other
 *      inputs within physiologically sensible bounds.
 *
 * The engine never runs unless eligibility passes.
 */

import { MODEL_META } from '../config/references.js';

/** Established-ASCVD screening questions. Any "yes" => ineligible. */
export const ASCVD_CONDITIONS = [
  { key: 'priorMI',        labelTh: 'เคยมีภาวะกล้ามเนื้อหัวใจตาย (heart attack / myocardial infarction)' },
  { key: 'knownCAD',       labelTh: 'ได้รับการวินิจฉัยว่าเป็นโรคหลอดเลือดหัวใจตีบ (coronary artery disease)' },
  { key: 'priorStroke',    labelTh: 'เคยเป็นโรคหลอดเลือดสมอง หรือสมองขาดเลือดชั่วคราว (stroke / TIA)' },
  { key: 'pad',            labelTh: 'เคยได้รับการวินิจฉัยว่ามีหลอดเลือดแดงส่วนปลายตีบ (peripheral arterial disease)' },
  { key: 'revascularization', labelTh: 'เคยทำบอลลูน/ใส่ขดลวด หรือผ่าตัดบายพาสหลอดเลือดหัวใจ (PCI / CABG)' },
  { key: 'otherAscvd',     labelTh: 'เคยได้รับการวินิจฉัยว่าเป็นโรคหลอดเลือดแดงแข็งอื่น ๆ (established ASCVD)' }
];

export const INPUT_LIMITS = {
  age:      { min: MODEL_META.eligibleAgeRange.min, max: MODEL_META.eligibleAgeRange.max, unit: 'ปี' },
  sbp:      { min: 70,  max: 220, unit: 'mmHg' },
  waistCm:  { min: 40,  max: 200, unit: 'ซม.' },
  heightCm: { min: 120, max: 210, unit: 'ซม.' }
};

/**
 * @param {object} answers  { priorMI, knownCAD, priorStroke, pad, revascularization, otherAscvd }
 * @returns {{eligible:boolean, reasons:string[]}}
 */
export function checkAscvdEligibility(answers = {}) {
  const flagged = ASCVD_CONDITIONS.filter(c => truthy(answers[c.key]));
  return {
    eligible: flagged.length === 0,
    reasons: flagged.map(c => c.labelTh)
  };
}

/**
 * @returns {{ok:boolean, errors:Array<{field:string,message:string}>}}
 */
export function validateInputs(input = {}) {
  const errors = [];
  const check = (field, value) => {
    const lim = INPUT_LIMITS[field];
    const n = Number(value);
    if (!Number.isFinite(n)) {
      errors.push({ field, message: `กรุณากรอก ${field} ให้เป็นตัวเลข` });
    } else if (n < lim.min || n > lim.max) {
      errors.push({ field, message: `ค่า ${field} ควรอยู่ระหว่าง ${lim.min}–${lim.max} ${lim.unit}` });
    }
  };
  check('age', input.age);
  check('sbp', input.sbp);
  check('waistCm', input.waistCm);
  check('heightCm', input.heightCm);

  if (input.sex === undefined || input.sex === null || input.sex === '') {
    errors.push({ field: 'sex', message: 'กรุณาระบุเพศ' });
  }
  return { ok: errors.length === 0, errors };
}

/** Full gate: ASCVD screen + input validation. */
export function assessEligibility(answers, input) {
  const ascvd = checkAscvdEligibility(answers);
  const inputs = validateInputs(input);
  return {
    eligible: ascvd.eligible,          // established ASCVD => not eligible for score
    ascvd,
    inputs,
    canCompute: ascvd.eligible && inputs.ok
  };
}

function truthy(v) {
  if (v === true || v === 1) return true;
  const s = String(v).trim().toLowerCase();
  return ['1', 'yes', 'true', 'y', 'ใช่'].includes(s);
}

/** Thai message shown to ineligible (established-ASCVD) users. */
export const INELIGIBLE_MESSAGE_TH =
  'แบบประเมินนี้ออกแบบสำหรับผู้ที่ยังไม่มีโรคหัวใจและหลอดเลือดที่ได้รับการวินิจฉัย ' +
  'จากคำตอบของท่าน ท่านอาจมีโรคหัวใจและหลอดเลือดอยู่แล้ว จึงไม่เหมาะสมที่จะใช้แบบประเมินความเสี่ยงแบบปฐมภูมินี้ ' +
  'ขอแนะนำให้ท่านเข้ารับการประเมินและวางแผนการดูแลรักษา (secondary prevention) โดยแพทย์โดยตรง';
