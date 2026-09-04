/**
 * interpretation.test.js
 * Verifies category banding, the >30% display cap, "n in 100" phrasing,
 * and driver/recommendation generation.
 */
import { interpretRisk } from '../src/interpretation/riskInterpretation.js';
import { buildRecommendations } from '../src/interpretation/recommendationRules.js';
import { bandForPercent } from '../src/config/riskThresholds.js';

function assert(cond, msg, bag) { if (!cond) { bag.failures++; console.log('  FAIL ' + msg); } else { bag.passed++; } }

export function run() {
  const bag = { passed: 0, failures: 0 };

  // Banding
  assert(bandForPercent(5).key === 'low', '5% -> low', bag);
  assert(bandForPercent(10).key === 'moderate', '10% -> moderate', bag);
  assert(bandForPercent(19.9).key === 'moderate', '19.9% -> moderate', bag);
  assert(bandForPercent(20).key === 'high', '20% -> high', bag);
  assert(bandForPercent(30).key === 'high', '30% -> high', bag);
  assert(bandForPercent(30.5).key === 'veryHigh', '30.5% -> very high', bag);

  // Display cap
  const capped = interpretRisk({ riskPercent: 55, riskFraction: 0.55 });
  assert(capped.displayCapped === true, '55% is capped', bag);
  assert(capped.displayPercentText.includes('มากกว่า 30'), 'capped shows >30 text', bag);

  const normal = interpretRisk({ riskPercent: 12.34, riskFraction: 0.1234 });
  assert(normal.displayPercentText === '12.3', '12.34 -> "12.3"', bag);
  assert(normal.perHundred === '12', '12.34 -> 12 per 100', bag);
  assert(normal.band.key === 'moderate', '12.34 -> moderate band', bag);

  // Drivers & recommendations
  const rr = buildRecommendations({ age: 62, sex: 'male', currentSmoker: 1, diabetes: 1, sbp: 150, waistCm: 100, heightCm: 165 });
  const keys = rr.drivers.map(d => d.key);
  assert(keys.includes('smoking'), 'smoker -> smoking driver', bag);
  assert(keys.includes('diabetes'), 'dm -> diabetes driver', bag);
  assert(keys.includes('sbp'), 'sbp150 -> sbp driver', bag);
  assert(keys.includes('centralObesity'), 'whr>=0.5 -> central obesity driver', bag);
  assert(keys.includes('age'), 'age62 -> age driver', bag);
  // no percentage contribution exposed
  assert(rr.drivers.every(d => !('percent' in d)), 'drivers expose no % contribution', bag);

  const clean = buildRecommendations({ age: 40, sex: 'female', currentSmoker: 0, diabetes: 0, sbp: 115, waistCm: 68, heightCm: 165 });
  assert(clean.drivers.filter(d => d.modifiable).length === 0, 'optimal profile -> no modifiable drivers', bag);
  assert(clean.recommendations.some(r => r.key === 'general'), 'general recommendation always present', bag);

  console.log(`\n=== Interpretation tests ===\n${bag.failures === 0 ? 'ALL ' + bag.passed + ' PASS ✓' : bag.failures + ' FAILED ✗'}`);
  return { name: 'interpretation', total: bag.passed + bag.failures, failures: bag.failures };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const res = run();
  process.exit(res.failures === 0 ? 0 : 1);
}
