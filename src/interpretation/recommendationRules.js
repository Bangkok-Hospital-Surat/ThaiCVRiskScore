/**
 * recommendationRules.js
 * Derives (A) RISK DRIVERS worth attention and (B) WHAT-TO-DO-NEXT guidance
 * from the entered risk factors. General preventive guidance only — this is
 * NOT autonomous treatment prescribing, and it does NOT claim a numeric
 * percentage contribution for each factor.
 *
 * Drivers may be ORDERED by each term's contribution to the model's linear
 * predictor (β·x), which is mathematically supported, but they are presented
 * qualitatively (present / not present), never as a "% of your risk".
 */
import { MODEL_CONSTANTS, sexToCode } from '../calculator/thaiCvNonLab.js';

const WHR_CENTRAL_OBESITY = 0.5;   // "keep waist < half your height"
const SBP_HIGH = 140;              // clinically elevated systolic BP
const SBP_BORDERLINE = 130;
const AGE_DRIVER = 60;

/**
 * @param {object} input  { age, sex, currentSmoker, diabetes, sbp, waistCm, heightCm }
 * @returns {{drivers:Array, recommendations:Array}}
 */
export function buildRecommendations(input) {
  const age = Number(input.age);
  const sex = sexToCode(input.sex);
  const smoker = bin(input.currentSmoker);
  const diabetes = bin(input.diabetes);
  const sbp = Number(input.sbp);
  const waistCm = Number(input.waistCm);
  const heightCm = Number(input.heightCm);
  const whr = waistCm > 0 && heightCm > 0 ? waistCm / heightCm : 0;
  const b = MODEL_CONSTANTS.whr.beta;

  const drivers = [];
  const recommendations = [];

  // --- Smoking ---
  if (smoker === 1) {
    drivers.push(driver('smoking', 'การสูบบุหรี่', 'warning', b.smoker * 1));
    recommendations.push(rec('smoking',
      'เลิกบุหรี่',
      'การเลิกสูบบุหรี่เป็นสิ่งที่ลดความเสี่ยงโรคหัวใจและหลอดเลือดได้มากและเร็วที่สุด สามารถขอคำปรึกษาสายเลิกบุหรี่ 1600 หรือคลินิกเลิกบุหรี่'));
  }

  // --- Diabetes ---
  if (diabetes === 1) {
    drivers.push(driver('diabetes', 'โรคเบาหวาน', 'warning', b.diabetes * 1));
    recommendations.push(rec('diabetes',
      'ควบคุมเบาหวานและปัจจัยเสี่ยงร่วม',
      'ควบคุมระดับน้ำตาลให้อยู่ในเกณฑ์เป้าหมาย ร่วมกับการดูแลความดันโลหิต ไขมัน และน้ำหนัก ตามคำแนะนำของแพทย์'));
  }

  // --- Blood pressure ---
  if (sbp >= SBP_HIGH) {
    drivers.push(driver('sbp', 'ความดันโลหิตสูง', 'warning', b.sbp * sbp));
    recommendations.push(rec('sbp',
      'ประเมินและควบคุมความดันโลหิต',
      `ความดันตัวบนของท่าน (${sbp} mmHg) อยู่ในเกณฑ์สูง ควรวัดความดันซ้ำอย่างถูกวิธีหลายครั้ง และเข้ารับการประเมินภาวะความดันโลหิตสูงกับแพทย์`));
  } else if (sbp >= SBP_BORDERLINE) {
    drivers.push(driver('sbp', 'ความดันโลหิตค่อนข้างสูง', 'caution', b.sbp * sbp));
    recommendations.push(rec('sbp',
      'เฝ้าระวังความดันโลหิต',
      `ความดันตัวบน (${sbp} mmHg) เริ่มสูงกว่าปกติเล็กน้อย ควรวัดความดันอย่างสม่ำเสมอ ลดเค็ม และออกกำลังกาย`));
  }

  // --- Central obesity (WHR) ---
  if (whr >= WHR_CENTRAL_OBESITY) {
    drivers.push(driver('centralObesity', 'ภาวะอ้วนลงพุง (รอบเอวเทียบส่วนสูง)', 'caution', b.whr * whr));
    recommendations.push(rec('centralObesity',
      'ลดรอบเอว / ควบคุมน้ำหนัก',
      'รอบเอวของท่านมากกว่าครึ่งหนึ่งของส่วนสูง ซึ่งสัมพันธ์กับความเสี่ยงที่สูงขึ้น แนะนำควบคุมอาหาร ออกกำลังกายสม่ำเสมอ และตั้งเป้าให้รอบเอวน้อยกว่าครึ่งหนึ่งของส่วนสูง'));
  }

  // --- Age (non-modifiable, informational) ---
  if (age >= AGE_DRIVER) {
    drivers.push(driver('age', 'อายุ', 'info', b.age * age, /*modifiable*/ false));
  }

  // Always-on general recommendation
  recommendations.push(rec('general',
    'ดูแลสุขภาพหัวใจโดยรวม',
    'ออกกำลังกายสม่ำเสมอ รับประทานผักผลไม้และอาหารกากใยสูง ลดอาหารเค็มและไขมันอิ่มตัว และตรวจสุขภาพประจำปี'));

  // order modifiable drivers by contribution magnitude (supported by the model)
  drivers.sort((a, z) => z.contribution - a.contribution);

  return { drivers, recommendations };
}

function driver(key, labelTh, tone, contribution, modifiable = true) {
  return { key, labelTh, tone, contribution: Number(contribution) || 0, modifiable };
}
function rec(key, titleTh, detailTh) {
  return { key, titleTh, detailTh };
}
function bin(v) {
  if (v === 1 || v === true) return 1;
  const s = String(v).trim().toLowerCase();
  return ['1', 'yes', 'true', 'y', 'ใช่'].includes(s) ? 1 : 0;
}
