/** RiskDrivers.js — LAYER C: factors that deserve attention (qualitative, no % contribution). */
export function RiskDrivers(drivers) {
  const modifiable = drivers.filter(d => d.modifiable);
  if (drivers.length === 0) {
    return `<div class="result-section">
      <h3>ปัจจัยเสี่ยงของท่าน</h3>
      <div class="drivers"><span class="chip positive">ไม่พบปัจจัยเสี่ยงที่ปรับเปลี่ยนได้ที่เด่นชัด</span></div>
    </div>`;
  }
  const chips = drivers.map(d => `<span class="chip ${d.tone}">${d.labelTh}</span>`).join('');
  const note = modifiable.length
    ? '<p class="helper">ปัจจัยเหล่านี้เรียงตามน้ำหนักที่มีต่อความเสี่ยงในสมการ ปัจจัยที่ปรับเปลี่ยนได้คือโอกาสในการลดความเสี่ยงของท่าน</p>'
    : '';
  return `<div class="result-section">
    <h3>ปัจจัยเสี่ยงที่ควรใส่ใจ</h3>
    <div class="drivers">${chips}</div>
    ${note}
  </div>`;
}
