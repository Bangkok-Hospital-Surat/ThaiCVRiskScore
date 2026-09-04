/**
 * exportSummary.js
 * One-page summary export: print/PDF (window.print) and a self-contained PNG
 * result card (drawn on <canvas>, no external libraries — CSP-safe) that can be
 * shared via the native share sheet (LINE on mobile) or downloaded.
 *
 * Privacy: everything happens in the browser. Nothing is uploaded. The image is
 * created only when the user asks, and is handed to the OS share sheet or a
 * local download — no network egress.
 */
import { MODEL_META } from '../config/references.js';

const SEX_TH = { male: 'ชาย', female: 'หญิง' };

/* ---------------- Print / PDF ---------------- */
export function printSummary() {
  // The print stylesheet (css/style.css @media print) formats the visible
  // result card into a clean one-page layout and hides chrome/buttons.
  window.print();
}

/* ---------------- PNG result card ---------------- */
const W = 1080;
const PAD = 64;
const CW = W - PAD * 2;

function wrap(ctx, text, maxWidth) {
  const lines = [];
  // split on spaces first; long space-less runs (Thai) are broken by character
  const words = String(text).split(/(\s+)/);
  let line = '';
  const pushChars = (chunk) => {
    for (const ch of chunk) {
      if (ctx.measureText(line + ch).width > maxWidth && line) { lines.push(line); line = ''; }
      line += ch;
    }
  };
  for (const w of words) {
    if (ctx.measureText(line + w).width <= maxWidth) { line += w; }
    else if (ctx.measureText(w).width > maxWidth) { pushChars(w); }
    else { if (line) lines.push(line.trimEnd()); line = w.trimStart(); }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

async function buildPngBlob(data) {
  const { interp, reco, inputs } = data;
  try { await document.fonts.ready; } catch { /* system fonts */ }

  const FONT = '"Noto Sans Thai", Inter, Tahoma, sans-serif';
  // ---- measuring pass on a throwaway context ----
  const meas = document.createElement('canvas').getContext('2d');
  const blocks = [];
  const addText = (text, size, weight, color, gapAfter) => {
    meas.font = `${weight} ${size}px ${FONT}`;
    const lines = wrap(meas, text, CW);
    blocks.push({ type: 'text', lines, size, weight, color, lh: Math.round(size * 1.4), gapAfter });
  };

  // header + divider
  blocks.push({ type: 'header' });
  // headline
  addText(interp.headlineTh, 34, '700', '#0d3155', 12);
  // risk block placeholder (fixed height)
  blocks.push({ type: 'risk', h: 240, color: interp.band.color,
    pct: interp.displayPercentText, capped: interp.displayCapped, band: interp.band.labelTh, gapAfter: 26 });
  // meaning
  addText(interp.meaningTh, 32, '400', '#102f52', 8);
  addText(interp.meaningNoteTh, 24, '400', '#526b84', 22);
  // inputs summary
  const inLine = `ข้อมูลที่ใช้: อายุ ${inputs.age} ปี · ${SEX_TH[inputs.sex] || inputs.sex} · ` +
    `ความดันตัวบน ${inputs.sbp} mmHg · รอบเอว ${inputs.waistCm} ซม. · สูง ${inputs.heightCm} ซม. · ` +
    `${bin(inputs.currentSmoker) ? 'สูบบุหรี่' : 'ไม่สูบบุหรี่'} · ${bin(inputs.diabetes) ? 'เป็นเบาหวาน' : 'ไม่เป็นเบาหวาน'}`;
  addText(inLine, 26, '400', '#284b6c', 18);
  // drivers
  if (reco.drivers.length) {
    addText('ปัจจัยเสี่ยงที่ควรใส่ใจ: ' + reco.drivers.map(d => d.labelTh).join(' · '), 28, '700', '#b3271e', 14);
  }
  // recommendations (titles only)
  if (reco.recommendations.length) {
    addText('คำแนะนำ: ' + reco.recommendations.map(r => r.titleTh).join(' · '), 27, '400', '#12614c', 20);
  }
  blocks.push({ type: 'divider', gapAfter: 16 });
  // disclaimer
  addText('แบบประเมินนี้ใช้ช่วยประเมินความเสี่ยงเบื้องต้น ไม่ใช่การวินิจฉัยโรคหรือคำแนะนำการรักษา ' +
    'ควรพิจารณาร่วมกับคำแนะนำของบุคลากรทางการแพทย์', 23, '400', '#6b4d16', 14);
  // footer
  const gen = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const reviewed = MODEL_META.clinicalReviewDate || 'PRE-UAT (ยังไม่รับรองทางคลินิก)';
  addText(`${MODEL_META.appName} · ${MODEL_META.moduleName} · Model ${MODEL_META.modelVersion} · Clinical Review: ${reviewed} · สร้างเมื่อ ${gen}`,
    21, '400', '#526b84', 0);

  // ---- compute total height ----
  let y = PAD;
  const HEADER_H = 92, DIVIDER_GAP = 22;
  for (const b of blocks) {
    if (b.type === 'header') y += HEADER_H;
    else if (b.type === 'risk') y += b.h + (b.gapAfter || 0);
    else if (b.type === 'divider') y += DIVIDER_GAP + (b.gapAfter || 0);
    else { y += b.lines.length * b.lh + (b.gapAfter || 0); }
  }
  const H = Math.round(y + PAD);

  // ---- render pass ----
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'top';

  y = PAD;
  for (const b of blocks) {
    if (b.type === 'header') {
      ctx.font = `800 30px ${FONT}`; ctx.fillStyle = '#092f5f'; ctx.textAlign = 'left';
      ctx.fillText('HeartCheck Wise · Thai CV Risk (ไม่ใช้ผลเลือด)', PAD, y);
      ctx.font = `800 22px ${FONT}`; ctx.fillStyle = '#b54708'; ctx.textAlign = 'right';
      ctx.fillText('PRE-UAT', W - PAD, y + 4);
      ctx.textAlign = 'left';
      ctx.strokeStyle = '#d8e5ef'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(PAD, y + 56); ctx.lineTo(W - PAD, y + 56); ctx.stroke();
      y += HEADER_H;
    } else if (b.type === 'risk') {
      roundRect(ctx, PAD, y, CW, b.h, 24); ctx.fillStyle = b.color; ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
      ctx.font = `800 130px ${FONT}`;
      const pctText = b.capped ? b.pct + '%' : b.pct + '%';
      ctx.fillText(pctText, W / 2, y + 40);
      ctx.font = `700 40px ${FONT}`;
      ctx.fillText(b.band, W / 2, y + 180);
      ctx.textAlign = 'left';
      y += b.h + (b.gapAfter || 0);
    } else if (b.type === 'divider') {
      y += (DIVIDER_GAP / 2);
      ctx.strokeStyle = '#e6eef5'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
      y += (DIVIDER_GAP / 2) + (b.gapAfter || 0);
    } else {
      ctx.font = `${b.weight} ${b.size}px ${FONT}`; ctx.fillStyle = b.color;
      for (const ln of b.lines) { ctx.fillText(ln, PAD, y); y += b.lh; }
      y += (b.gapAfter || 0);
    }
  }

  return await new Promise(res => canvas.toBlob(res, 'image/png'));
}

export async function shareOrDownloadSummary(data) {
  const blob = await buildPngBlob(data);
  if (!blob) return { ok: false, reason: 'no-blob' };
  const file = new File([blob], 'thai-cv-risk-summary.png', { type: 'image/png' });

  // Prefer native share sheet (LINE etc.) on capable devices.
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'ผลประเมินความเสี่ยงหัวใจ (Thai CV Risk)',
        text: 'ผลประเมินความเสี่ยงโรคหัวใจและหลอดเลือดใน 10 ปี (ไม่ใช่การวินิจฉัย)'
      });
      return { ok: true, method: 'share' };
    } catch (err) {
      if (err && err.name === 'AbortError') return { ok: true, method: 'cancelled' };
      // fall through to download
    }
  }
  // Fallback: download the PNG.
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'thai-cv-risk-summary.png';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return { ok: true, method: 'download' };
}

function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function bin(v) { return (v === 1 || v === true || ['1','yes','true','y','ใช่'].includes(String(v).toLowerCase())) ? 1 : 0; }
