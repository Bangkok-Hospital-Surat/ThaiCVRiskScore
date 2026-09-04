/**
 * riskThresholds.js
 * Risk-category CONFIGURATION only — a communication layer.
 * These bands are NOT part of the equation and MUST NOT be used to drive
 * treatment decisions directly. They exist to translate a percentage into
 * plain language and colour. Edit here without touching the engine.
 *
 * Bands follow the official Thai CV Risk Score interpretation:
 *   < 10%   low
 *   10–<20% moderate
 *   20–≤30% high
 *   > 30%   very high  (the official calculator reports ">30%" rather than a number)
 */

export const DISPLAY_CAP_PERCENT = 30; // official convention: above this, show ">30%"

export const RISK_BANDS = [
  {
    key: 'low',
    minPct: 0,
    maxPct: 10,          // [0,10)
    labelTh: 'ความเสี่ยงน้อย',
    labelEn: 'Low risk',
    color: '#2e9e5b',
    tone: 'positive'
  },
  {
    key: 'moderate',
    minPct: 10,
    maxPct: 20,          // [10,20)
    labelTh: 'ความเสี่ยงปานกลาง',
    labelEn: 'Moderate risk',
    color: '#e0a021',
    tone: 'caution'
  },
  {
    key: 'high',
    minPct: 20,
    maxPct: 30.0000001,  // [20,30]
    labelTh: 'ความเสี่ยงสูง',
    labelEn: 'High risk',
    color: '#e2662c',
    tone: 'warning'
  },
  {
    key: 'veryHigh',
    minPct: 30.0000001,
    maxPct: Infinity,    // (30, ∞)
    labelTh: 'ความเสี่ยงสูงมาก',
    labelEn: 'Very high risk',
    color: '#cf3b3b',
    tone: 'danger'
  }
];

/** Return the band object for a given risk percentage. */
export function bandForPercent(pct) {
  return RISK_BANDS.find(b => pct >= b.minPct && pct < b.maxPct) || RISK_BANDS[RISK_BANDS.length - 1];
}
