/** RecommendationCard.js — LAYER D: what to do next (general preventive guidance). */
export function RecommendationCard(recommendations) {
  const items = recommendations.map(r => `
    <li><strong>${r.titleTh}</strong><span>${r.detailTh}</span></li>`).join('');
  return `<div class="result-section">
    <h3>สิ่งที่ควรทำต่อไป</h3>
    <ul class="recs">${items}</ul>
    <p class="helper">คำแนะนำนี้เป็นแนวทางป้องกันทั่วไป ไม่ใช่การสั่งการรักษา โปรดปรึกษาแพทย์สำหรับแผนการดูแลเฉพาะบุคคล</p>
  </div>`;
}
