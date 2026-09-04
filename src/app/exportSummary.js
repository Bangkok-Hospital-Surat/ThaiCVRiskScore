/**
 * exportSummary.js
 * One-page summary export as a self-contained result card drawn on <canvas>
 * (no external libraries — CSP-safe). The card can be exported as:
 *   - PNG  → shared via the native share sheet (LINE on mobile) or downloaded.
 *   - PDF  → a minimal single-page PDF that embeds the card as a JPEG, then
 *            shared or downloaded. This does NOT use window.print(), which is a
 *            no-op in the LINE in-app browser and several mobile webviews.
 *
 * Privacy: everything happens in the browser. Nothing is uploaded. Files are
 * created only when the user asks, and handed to the OS share sheet or a local
 * download — no network egress.
 */
import { MODEL_META } from '../config/references.js';

const SEX_TH = { male: 'ชาย', female: 'หญิง' };

/* ---------------- shared canvas renderer ---------------- */
const W = 1080;
const PAD = 64;
const CW = W - PAD * 2;

function wrap(ctx, text, maxWidth) {
  const lines = [];
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

function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

// Same-origin footer banner (hospital logo + contact + QR). Same-origin so it
// does NOT taint the canvas (toBlob/toDataURL still work).
const BANNER_URL = new URL('../../assets/bsr-footer-banner.jpg', import.meta.url).href;

async function renderCardCanvas(data) {
  const { interp, reco, inputs } = data;
  try { await document.fonts.ready; } catch { /* system fonts */ }
  let banner = null;
  try { banner = await loadImage(BANNER_URL); } catch { /* banner optional */ }

  const FONT = '"Noto Sans Thai", Inter, Tahoma, sans-serif';
  const meas = document.createElement('canvas').getContext('2d');
  const blocks = [];
  const addText = (text, size, weight, color, gapAfter) => {
    meas.font = `${weight} ${size}px ${FONT}`;
    const lines = wrap(meas, text, CW);
    blocks.push({ type: 'text', lines, size, weight, color, lh: Math.round(size * 1.4), gapAfter });
  };

  blocks.push({ type: 'header' });
  addText(interp.headlineTh, 34, '700', '#0d3155', 12);
  blocks.push({ type: 'risk', h: 240, color: interp.band.color,
    pct: interp.displayPercentText, capped: interp.displayCapped, band: interp.band.labelTh, gapAfter: 26 });
  addText(interp.meaningTh, 32, '400', '#102f52', 8);
  addText(interp.meaningNoteTh, 24, '400', '#526b84', 22);
  const inLine = `ข้อมูลที่ใช้: อายุ ${inputs.age} ปี · ${SEX_TH[inputs.sex] || inputs.sex} · ` +
    `ความดันตัวบน ${inputs.sbp} mmHg · รอบเอว ${inputs.waistCm} ซม. · สูง ${inputs.heightCm} ซม. · ` +
    `${bin(inputs.currentSmoker) ? 'สูบบุหรี่' : 'ไม่สูบบุหรี่'} · ${bin(inputs.diabetes) ? 'เป็นเบาหวาน' : 'ไม่เป็นเบาหวาน'}`;
  addText(inLine, 26, '400', '#284b6c', 18);
  if (reco.drivers.length) {
    addText('ปัจจัยเสี่ยงที่ควรใส่ใจ: ' + reco.drivers.map(d => d.labelTh).join(' · '), 28, '700', '#b3271e', 14);
  }
  if (reco.recommendations.length) {
    addText('คำแนะนำ: ' + reco.recommendations.map(r => r.titleTh).join(' · '), 27, '400', '#12614c', 20);
  }
  blocks.push({ type: 'divider', gapAfter: 16 });
  addText('แบบประเมินนี้ใช้ช่วยประเมินความเสี่ยงเบื้องต้น ไม่ใช่การวินิจฉัยโรคหรือคำแนะนำการรักษา ' +
    'ควรพิจารณาร่วมกับคำแนะนำของบุคลากรทางการแพทย์', 23, '400', '#6b4d16', 14);
  const gen = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const reviewed = MODEL_META.clinicalReviewDate || 'PRE-UAT (ยังไม่รับรองทางคลินิก)';
  addText(`${MODEL_META.appName} · ${MODEL_META.moduleName} · Model ${MODEL_META.modelVersion} · Clinical Review: ${reviewed} · สร้างเมื่อ ${gen}`,
    21, '400', '#526b84', 0);

  // Footer banner (hospital logo + contact + QR) at the very bottom.
  if (banner && banner.naturalWidth) {
    blocks.push({ type: 'banner', img: banner, h: Math.round(CW * (banner.naturalHeight / banner.naturalWidth)), gapBefore: 30 });
  }

  let y = PAD;
  const HEADER_H = 92, DIVIDER_GAP = 22;
  for (const b of blocks) {
    if (b.type === 'header') y += HEADER_H;
    else if (b.type === 'risk') y += b.h + (b.gapAfter || 0);
    else if (b.type === 'divider') y += DIVIDER_GAP + (b.gapAfter || 0);
    else if (b.type === 'banner') y += (b.gapBefore || 0) + b.h;
    else y += b.lines.length * b.lh + (b.gapAfter || 0);
  }
  const H = Math.round(y + PAD);

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
      ctx.fillText(b.pct + '%', W / 2, y + 40);
      ctx.font = `700 40px ${FONT}`;
      ctx.fillText(b.band, W / 2, y + 180);
      ctx.textAlign = 'left';
      y += b.h + (b.gapAfter || 0);
    } else if (b.type === 'divider') {
      y += (DIVIDER_GAP / 2);
      ctx.strokeStyle = '#e6eef5'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
      y += (DIVIDER_GAP / 2) + (b.gapAfter || 0);
    } else if (b.type === 'banner') {
      y += (b.gapBefore || 0);
      ctx.drawImage(b.img, PAD, y, CW, b.h);
      y += b.h;
    } else {
      ctx.font = `${b.weight} ${b.size}px ${FONT}`; ctx.fillStyle = b.color;
      for (const ln of b.lines) { ctx.fillText(ln, PAD, y); y += b.lh; }
      y += (b.gapAfter || 0);
    }
  }
  return canvas;
}

/* ---------------- PNG ---------------- */
export async function buildPngBlob(data) {
  const canvas = await renderCardCanvas(data);
  return await new Promise(res => canvas.toBlob(res, 'image/png'));
}

/* ---------------- PDF (single page, embeds card as JPEG) ---------------- */
export async function buildPdfBlob(data) {
  const canvas = await renderCardCanvas(data);
  const jpeg = dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.92));
  return buildImagePdf(jpeg, canvas.width, canvas.height);
}

function buildImagePdf(jpeg, imgW, imgH) {
  const pageW = 595.28, pageH = 841.89, margin = 28;   // A4 points
  const availW = pageW - 2 * margin, availH = pageH - 2 * margin;
  let dW = availW, dH = dW * (imgH / imgW);
  if (dH > availH) { const s = availH / dH; dW *= s; dH *= s; }
  const x = (pageW - dW) / 2, yTop = pageH - margin - dH;
  const content =
    `q\n${dW.toFixed(2)} 0 0 ${dH.toFixed(2)} ${x.toFixed(2)} ${yTop.toFixed(2)} cm\n/Im0 Do\nQ\n`;
  const contentBytes = enc(content);

  const chunks = []; let pos = 0; const xref = [];
  const add = b => { chunks.push(b); pos += b.length; };
  const addObj = (n, dict, stream) => {
    xref[n] = pos;
    add(enc(`${n} 0 obj\n`)); add(enc(dict));
    if (stream) { add(enc(`\nstream\n`)); add(stream); add(enc(`\nendstream`)); }
    add(enc(`\nendobj\n`));
  };

  add(enc('%PDF-1.4\n'));
  add(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A])); // binary marker
  addObj(1, `<< /Type /Catalog /Pages 2 0 R >>`);
  addObj(2, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
  addObj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] ` +
            `/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  addObj(4, `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB ` +
            `/BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`, jpeg);
  addObj(5, `<< /Length ${contentBytes.length} >>`, contentBytes);

  const xrefPos = pos;
  let xr = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) xr += String(xref[i]).padStart(10, '0') + ' 00000 n \n';
  add(enc(xr));
  add(enc(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`));

  let total = 0; for (const c of chunks) total += c.length;
  const out = new Uint8Array(total); let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return new Blob([out], { type: 'application/pdf' });
}

/* ---------------- share / download ---------------- */
export async function shareOrDownloadSummary(data, format = 'png') {
  const isPdf = format === 'pdf';
  const blob = isPdf ? await buildPdfBlob(data) : await buildPngBlob(data);
  if (!blob) return { ok: false, reason: 'no-blob' };
  const name = isPdf ? 'thai-cv-risk-summary.pdf' : 'thai-cv-risk-summary.png';
  const type = isPdf ? 'application/pdf' : 'image/png';
  const file = new File([blob], name, { type });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      // Share the FILE ONLY. Passing `text`/`title` alongside `files` makes iOS
      // emit a second, separate text item (a stray "text" note) next to the file.
      await navigator.share({ files: [file] });
      return { ok: true, method: 'share' };
    } catch (err) {
      if (err && err.name === 'AbortError') return { ok: true, method: 'cancelled' };
      // fall through to download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return { ok: true, method: 'download' };
}

/* ---------------- helpers ---------------- */
function enc(s) { return new TextEncoder().encode(s); }
function dataUrlToBytes(dataUrl) {
  const b64 = dataUrl.split(',')[1];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function bin(v) { return (v === 1 || v === true || ['1','yes','true','y','ใช่'].includes(String(v).toLowerCase())) ? 1 : 0; }
