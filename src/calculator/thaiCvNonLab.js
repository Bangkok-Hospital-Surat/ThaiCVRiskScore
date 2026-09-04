/**
 * thaiCvNonLab.js
 * ---------------------------------------------------------------------------
 * Thai CV Risk Score — NON-LABORATORY model (10-year ASCVD risk).
 *
 * This is an INDEPENDENT re-implementation of the equation used by the
 * official Rama-Mahidol "Thai CV risk score 2.5" reference calculator (2021).
 * The coefficients below were extracted from the reference implementation and
 * independently cross-checked against the Thai MoPH HDC "43-file" standard,
 * which prints identical linear-predictor coefficients (see references.js and
 * docs/EQUATION_VERIFICATION.md).
 *
 * The engine is a PURE function of clinical inputs. It knows nothing about the
 * DOM, eligibility, interpretation, categories, or UI. Do not add any of those
 * concerns here.
 *
 * PRIMARY non-lab pathway = waist-to-height ratio (WHR).
 * A waist-circumference-only fallback is provided for completeness but the
 * app always collects height and uses the WHR pathway.
 *
 * Model form (Cox proportional hazards, 10-year):
 *     LP   = Σ (β_i · x_i)
 *     risk = 1 − S0 ^ exp( LP − centeringMean )
 *
 * Variable coding:
 *   age            years (35–70 eligible; formula guarded at age>1)
 *   sex            male = 1, female = 0
 *   currentSmoker  yes = 1, no = 0
 *   diabetes       yes = 1, no = 0
 *   sbp            systolic BP, mmHg (guarded at sbp ≥ 70)
 *   waistCm        waist circumference, centimetres
 *   heightCm       height, centimetres
 *   WHR            waistCm / heightCm  (unitless)
 * ---------------------------------------------------------------------------
 */

// ---- Canonical coefficients: Thai CV Risk Score v2.5 (Rama-Mahidol, 2021) ----
export const MODEL_CONSTANTS = Object.freeze({
  version: 'rama-tcvrs-2.5-2021',
  baselineSurvival: 0.964588, // S0 (10-year)
  whr: Object.freeze({
    beta: Object.freeze({
      age: 0.079,
      sex: 0.128,          // male = 1
      sbp: 0.019350987,
      diabetes: 0.58454,
      whr: 3.512566,
      smoker: 0.459
    }),
    centeringMean: 7.712325
  }),
  // waist-circumference-only fallback (cm) — used only if height is unavailable
  wcOnly: Object.freeze({
    beta: Object.freeze({
      age: 0.08372,
      sex: 0.05988,
      sbp: 0.02034,
      diabetes: 0.59953,
      wc: 0.01283,
      smoker: 0.459
    }),
    centeringMean: 7.31047
  })
});

/** Normalise a sex value to the model coding (male=1, female=0). */
export function sexToCode(sex) {
  if (sex === 1 || sex === 0) return sex;
  const s = String(sex).trim().toLowerCase();
  if (s === 'male' || s === 'm' || s === 'ชาย') return 1;
  if (s === 'female' || s === 'f' || s === 'หญิง') return 0;
  throw new Error(`Invalid sex value: ${sex}`);
}

function bin(v) {
  if (v === 1 || v === 0) return v;
  if (v === true) return 1;
  if (v === false) return 0;
  const s = String(v).trim().toLowerCase();
  if (['1', 'yes', 'true', 'y', 'ใช่'].includes(s)) return 1;
  if (['0', 'no', 'false', 'n', 'ไม่ใช่', ''].includes(s)) return 0;
  throw new Error(`Invalid binary value: ${v}`);
}

/**
 * Compute 10-year Thai CV (non-lab) risk from clinical inputs.
 * @returns {{riskFraction:number, riskPercent:number, linearPredictor:number,
 *            whr:number, method:string, valid:boolean, reason?:string}}
 */
export function computeNonLabRisk(input) {
  const age = Number(input.age);
  const sex = sexToCode(input.sex);
  const smoker = bin(input.currentSmoker);
  const diabetes = bin(input.diabetes);
  const sbp = Number(input.sbp);
  const waistCm = Number(input.waistCm);
  const heightCm = Number(input.heightCm);

  // Reference guards (mirror TASCVDformular): age>1 and sbp>=70.
  if (!Number.isFinite(age) || !Number.isFinite(sbp) || age <= 1 || sbp < 70) {
    return { valid: false, reason: 'inputs-out-of-guard', riskFraction: 0, riskPercent: 0,
             linearPredictor: 0, whr: 0, method: 'none' };
  }

  // Primary path: WHR (requires waist and height).
  if (Number.isFinite(waistCm) && Number.isFinite(heightCm) && waistCm > 0 && heightCm > 0) {
    const whr = waistCm / heightCm;
    const m = MODEL_CONSTANTS.whr;
    const lp =
      m.beta.age * age +
      m.beta.sex * sex +
      m.beta.sbp * sbp +
      m.beta.diabetes * diabetes +
      m.beta.whr * whr +
      m.beta.smoker * smoker;
    const risk = 1 - Math.pow(MODEL_CONSTANTS.baselineSurvival, Math.exp(lp - m.centeringMean));
    return {
      valid: true, riskFraction: risk, riskPercent: risk * 100,
      linearPredictor: lp, whr, method: 'whr'
    };
  }

  // Fallback path: waist circumference only.
  if (Number.isFinite(waistCm) && waistCm > 0) {
    const m = MODEL_CONSTANTS.wcOnly;
    const lp =
      m.beta.age * age +
      m.beta.sex * sex +
      m.beta.sbp * sbp +
      m.beta.diabetes * diabetes +
      m.beta.wc * waistCm +
      m.beta.smoker * smoker;
    const risk = 1 - Math.pow(MODEL_CONSTANTS.baselineSurvival, Math.exp(lp - m.centeringMean));
    return {
      valid: true, riskFraction: risk, riskPercent: risk * 100,
      linearPredictor: lp, whr: 0, method: 'wc'
    };
  }

  return { valid: false, reason: 'missing-anthropometry', riskFraction: 0, riskPercent: 0,
           linearPredictor: 0, whr: 0, method: 'none' };
}

export default { computeNonLabRisk, MODEL_CONSTANTS, sexToCode };
