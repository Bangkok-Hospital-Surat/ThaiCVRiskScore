/** run-all.js — runs every test suite; non-zero exit on any failure. */
import { run as validation } from './validation.test.js';
import { run as eligibility } from './eligibility.test.js';
import { run as interpretation } from './interpretation.test.js';

const results = [validation(), eligibility(), interpretation()];
const totalFail = results.reduce((s, r) => s + r.failures, 0);
const totalCase = results.reduce((s, r) => s + r.total, 0);

console.log('\n======================================');
console.log('SUMMARY');
for (const r of results) {
  console.log(`  ${r.name.padEnd(16)} ${r.total - r.failures}/${r.total} pass`);
}
console.log(`  TOTAL            ${totalCase - totalFail}/${totalCase} pass`);
console.log(totalFail === 0 ? 'RESULT: ALL SUITES PASS ✓' : `RESULT: ${totalFail} FAILURES ✗`);
console.log('======================================');
process.exit(totalFail === 0 ? 0 : 1);
