/**
 * eligibility.test.js
 * Verifies the ASCVD safety gate and input-range validation.
 */
import { assessEligibility, checkAscvdEligibility, validateInputs } from '../src/eligibility/eligibilityRules.js';

function assert(cond, msg, bag) { if (!cond) { bag.failures++; console.log('  FAIL ' + msg); } else { bag.passed++; } }

export function run() {
  const bag = { passed: 0, failures: 0 };

  // Established ASCVD => ineligible
  assert(checkAscvdEligibility({ priorMI: true }).eligible === false, 'prior MI -> ineligible', bag);
  assert(checkAscvdEligibility({ priorStroke: 'yes' }).eligible === false, 'prior stroke -> ineligible', bag);
  assert(checkAscvdEligibility({ revascularization: 1 }).eligible === false, 'PCI/CABG -> ineligible', bag);
  assert(checkAscvdEligibility({}).eligible === true, 'no ASCVD -> eligible', bag);

  // Input ranges
  assert(validateInputs({ age: 50, sex: 'male', sbp: 120, waistCm: 90, heightCm: 170 }).ok === true, 'valid inputs pass', bag);
  assert(validateInputs({ age: 25, sex: 'male', sbp: 120, waistCm: 90, heightCm: 170 }).ok === false, 'age 25 below range fails', bag);
  assert(validateInputs({ age: 80, sex: 'male', sbp: 120, waistCm: 90, heightCm: 170 }).ok === false, 'age 80 above range fails', bag);
  assert(validateInputs({ age: 50, sex: 'male', sbp: 60, waistCm: 90, heightCm: 170 }).ok === false, 'sbp 60 below range fails', bag);
  assert(validateInputs({ age: 50, sex: '', sbp: 120, waistCm: 90, heightCm: 170 }).ok === false, 'missing sex fails', bag);

  // Full gate
  const g1 = assessEligibility({ priorMI: true }, { age: 50, sex: 'male', sbp: 120, waistCm: 90, heightCm: 170 });
  assert(g1.canCompute === false, 'ASCVD blocks compute even with valid inputs', bag);
  const g2 = assessEligibility({}, { age: 50, sex: 'male', sbp: 120, waistCm: 90, heightCm: 170 });
  assert(g2.canCompute === true, 'clean case can compute', bag);

  console.log(`\n=== Eligibility tests ===\n${bag.failures === 0 ? 'ALL ' + bag.passed + ' PASS ✓' : bag.failures + ' FAILED ✗'}`);
  return { name: 'eligibility', total: bag.passed + bag.failures, failures: bag.failures };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const res = run();
  process.exit(res.failures === 0 ? 0 : 1);
}
