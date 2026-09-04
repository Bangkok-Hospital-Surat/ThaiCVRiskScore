/**
 * references.js
 * Auditable source list, model version and clinical-review metadata.
 * Kept separate from the equation engine so citations can be updated
 * without touching any calculation code.
 */

export const MODEL_META = {
  appName: 'HeartCheck Wise',
  moduleName: 'Thai CV Risk Score – Non-Lab',
  // Model version tracks OUR module. The underlying equation is Rama v2.5 (2021).
  modelVersion: '1.0.0',
  equationSource: 'Thai CV Risk Score v2.5 (Rama-Mahidol, 2021) — non-laboratory (waist-to-height) model',
  equationStatus: 'VERIFIED (coefficients cross-checked against 2 independent authoritative sources)',
  predictionHorizonYears: 10,
  outcomeDefinition:
    'ภาวะหลอดเลือดแดงแข็งชนิดรุนแรง (ASCVD) ภายใน 10 ปี — นิยามว่า การเสียชีวิตจากโรคหลอดเลือดหัวใจ หรือกล้ามเนื้อหัวใจตายชนิดไม่เสียชีวิต หรือโรคหลอดเลือดสมอง (อัมพฤกษ์/อัมพาต) ชนิดเสียชีวิตหรือไม่เสียชีวิต',
  outcomeDefinitionEn:
    'Atherosclerotic cardiovascular disease (ASCVD) within 10 years — coronary death, or non-fatal myocardial infarction, or fatal/non-fatal stroke.',
  derivationCohort: 'EGAT study (Electricity Generating Authority of Thailand) — pooled ~20-year cohort',
  eligibleAgeRange: { min: 35, max: 70 },
  clinicalReviewDate: null,          // set ONLY after a named clinician signs off
  clinicalReviewer: null,
  lastTechnicalReview: '2026-09-04'  // date this engine/spec was assembled & self-validated
};

/**
 * Ordered by the source-priority stated in the project brief.
 * `role` marks how each source was used in verification.
 */
export const REFERENCES = [
  {
    id: 'rama-tcvrs-2021',
    role: 'OFFICIAL REFERENCE IMPLEMENTATION (primary; coefficients + S0 + centering)',
    citation:
      'Thai CV Risk Score (Rama-Mahidol), online calculator v2.5, Copyright 2021. Faculty of Medicine Ramathibodi Hospital, Mahidol University.',
    url: 'https://www.rama.mahidol.ac.th/cardio_vascular_risk/thai_cv_risk_score/tcvrs_en.html',
    note: 'Non-lab equation extracted verbatim from the calculator’s client-side scripts/formular.js (function TASCVDformular).'
  },
  {
    id: 'moph-hdc-43file',
    role: 'INDEPENDENT CROSS-CHECK (identical linear-predictor coefficients)',
    citation:
      'Thai Ministry of Public Health — HDC / "43-file" (43 แฟ้ม) CVD Risk standard, Thai CV Risk Score specification (2561/2018).',
    url: 'http://info2.muaklekhospital.com/wp-content/uploads/2018/08/cvd2561_d.pdf',
    note: 'Reproduces the same lab and non-lab coefficients used by the MoPH national HDC data exchange. Uses an earlier calibration (S0=0.978296, non-lab centering 7.720484).'
  },
  {
    id: 'egat-cohort-profile',
    role: 'DERIVATION COHORT PROFILE',
    citation:
      'Vathesatogkit P, Woodward M, Tanomsup S, et al. Cohort profile: the Electricity Generating Authority of Thailand study. Int J Epidemiol. 2012;41(2):359-365.',
    url: 'https://doi.org/10.1093/ije/dyq218'
  },
  {
    id: 'external-validation-south',
    role: 'EXTERNAL VALIDATION (structure, outcome, non-lab uses WHR, risk bands)',
    citation:
      'Aramcharoen S, Satian P, Chotikarn P, Triukose S. An external validation of Thais’ cardiovascular 10-year risk assessment in southern Thailand. (Chulalongkorn CUBIC).',
    url: 'https://arxiv.org/abs/1811.03860'
  },
  {
    id: 'vajira-supplement',
    role: 'CORROBORATION (eligibility 35–70, outcome definition, official URL)',
    citation:
      'Chopchai K, Wanlapakorn C, Issaragrisil S, et al. The Correlation between Thai Cardiovascular Risk Score and the MESA Risk Score in Thai Populations. Vajira Medical Journal. 2022;66(2).',
    url: 'https://he02.tci-thaijo.org/index.php/VMED/article/view/249392'
  },
  {
    id: 'frontiers-cac-2023',
    role: 'CORROBORATION (model variables, 10-year ASCVD outcome)',
    citation:
      'Utility of coronary artery calcium in refining 10-year ASCVD risk prediction using a Thai CV risk score. Front Cardiovasc Med. 2023;10:1264640.',
    url: 'https://doi.org/10.3389/fcvm.2023.1264640'
  }
];

/** Guideline context for the clinician-facing references page. */
export const GUIDELINES = [
  {
    label: 'RCPT 2016 Clinical Practice Guideline on Dyslipidemia (Royal College of Physicians of Thailand)',
    note: 'Uses Thai CV risk to guide primary-prevention decisions.'
  },
  {
    label: 'Thai Hypertension Society — Guidelines in the Treatment of Hypertension',
    note: 'Incorporates Thai CV Risk Score in risk stratification.'
  },
  {
    label: 'Thai MoPH Division of NCDs — CVD risk assessment programme (HDC)',
    note: 'National roll-out of the Thai CV Risk Score via the 43-file data standard.'
  }
];
