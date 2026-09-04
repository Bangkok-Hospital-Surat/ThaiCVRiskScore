/**
 * riskModels.js
 * Model registry. Prepares for future models but ACTIVATES ONLY the
 * Thai CV Non-Lab model in this version. Do not enable others until they are
 * independently verified and validated.
 */
import { computeNonLabRisk } from './thaiCvNonLab.js';
import { MODEL_META } from '../config/references.js';

export const RISK_MODELS = {
  'thai-cv-nonlab': {
    id: 'thai-cv-nonlab',
    labelTh: 'Thai CV Risk Score – ไม่ใช้ผลเลือด',
    labelEn: 'Thai CV Risk Score – Non-Lab',
    version: MODEL_META.modelVersion,
    horizonYears: 10,
    enabled: true,
    compute: computeNonLabRisk
  },
  // --- Reserved / NOT YET ENABLED ---
  'thai-cv-lab':          { id: 'thai-cv-lab',          labelEn: 'Thai CV Risk Score – Lab',          enabled: false, compute: null },
  'prevent':              { id: 'prevent',              labelEn: 'AHA PREVENT',                        enabled: false, compute: null },
  'prevent-thai-recal':   { id: 'prevent-thai-recal',   labelEn: 'Thai-recalibrated PREVENT',          enabled: false, compute: null },
  'national-thai-cvd':    { id: 'national-thai-cvd',    labelEn: 'Future National Thai CVD Score',     enabled: false, compute: null }
};

export const ACTIVE_MODEL_ID = 'thai-cv-nonlab';

export function getActiveModel() {
  return RISK_MODELS[ACTIVE_MODEL_ID];
}
