/**
 * validation.test.js
 * Confirms the independent engine reproduces the official reference
 * implementation across the Golden Validation Set. Zero tolerance failures
 * allowed — this is a release gate.
 */
import { computeNonLabRisk } from '../src/calculator/thaiCvNonLab.js';
import { GOLDEN_CASES, VALIDATION_TOLERANCE } from '../src/calculator/validationCases.js';

export function run() {
  const rows = [];
  let failures = 0;

  for (const c of GOLDEN_CASES) {
    const out = computeNonLabRisk({
      age: c.age,
      sex: c.sex,
      currentSmoker: c.smoke,
      diabetes: c.dm,
      sbp: c.sbp,
      waistCm: c.waist_cm,
      heightCm: c.height_cm
    });
    const absErr = Math.abs(out.riskFraction - c.expected_risk);
    const pass = out.valid && absErr <= VALIDATION_TOLERANCE;
    if (!pass) failures++;
    rows.push({
      id: c.id,
      expected: c.expected_risk,
      calculated: +out.riskFraction.toFixed(8),
      absErr: +absErr.toExponential(2),
      result: pass ? 'PASS' : 'FAIL'
    });
  }

  // Print a compact audit table
  console.log('\n=== Golden Validation Set (Thai CV Non-Lab) ===');
  console.log('cases: ' + rows.length + ' | tolerance: ' + VALIDATION_TOLERANCE);
  for (const r of rows) {
    if (r.result === 'FAIL') {
      console.log(`  ${r.result}  ${r.id.padEnd(20)} exp=${r.expected} got=${r.calculated} err=${r.absErr}`);
    }
  }
  const maxErr = rows.reduce((m, r) => Math.max(m, Math.abs(r.calculated - r.expected)), 0);
  console.log(`max abs error: ${maxErr.toExponential(3)}`);
  console.log(failures === 0
    ? `ALL ${rows.length} CASES PASS ✓`
    : `${failures} / ${rows.length} CASES FAILED ✗`);

  return { name: 'validation', total: rows.length, failures, rows };
}

// allow direct execution
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const res = run();
  process.exit(res.failures === 0 ? 0 : 1);
}
