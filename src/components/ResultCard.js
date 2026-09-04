/** ResultCard.js — assembles the FOUR result layers + disclaimer. */
import { RiskDrivers } from './RiskDrivers.js';
import { RecommendationCard } from './RecommendationCard.js';
import { Disclaimer } from './Disclaimer.js';

/**
 * @param {object} interp  from interpretRisk()
 * @param {object} reco    { drivers, recommendations } from buildRecommendations()
 */
export function ResultCard(interp, reco) {
  const b = interp.band;
  const pctBlock = interp.displayCapped
    ? `<div class="risk-number">${interp.displayPercentText}<small>%</small></div>`
    : `<div class="risk-number">${interp.displayPercentText}<small>%</small></div>`;

  return `
  <div class="card">
    <!-- LAYER A: RISK -->
    <div class="result-head ${b.key}">
      <div class="cap">${interp.headlineTh}</div>
      ${pctBlock}
      <div class="risk-band">${b.labelTh}</div>
    </div>

    <!-- LAYER B: MEANING -->
    <div class="meaning">
      <p>${interp.meaningTh}</p>
      <span class="note">${interp.meaningNoteTh}</span>
    </div>

    <!-- LAYER C: RISK DRIVERS -->
    ${RiskDrivers(reco.drivers)}

    <!-- LAYER D: WHAT TO DO NEXT -->
    ${RecommendationCard(reco.recommendations)}

    <div class="result-section">${Disclaimer()}</div>

    <div class="actions">
      <button class="secondary" data-action="restart">เริ่มประเมินใหม่</button>
      <button class="secondary" data-action="show-refs">ดูหลักฐานและที่มา</button>
    </div>
  </div>`;
}
