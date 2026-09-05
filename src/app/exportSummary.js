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

// Same-origin assets. Same-origin => they do NOT taint the canvas.
const BANNER_URL = new URL('../../assets/bsr-footer-banner.jpg', import.meta.url).href;
const LOGO_URL = new URL('../../assets/BSR-landscape-logo.png', import.meta.url).href;

const FONT = '"Noto Sans Thai", Inter, Tahoma, sans-serif';
const INK = '#102f52', MUTED = '#556070', NAVY = '#0d3155';
const GAP = 16, TOP = 44, BOT = 44;

/*
 * Letterhead layout (like the PREVENT one-pager): hospital logo + title + date
 * on top, a horizontal rule, then framed content boxes, and the contact banner
 * at the foot. Two passes: measure section heights, then draw.
 */
async function renderCardCanvas(data) {
  const { interp, reco, inputs } = data;
  try { await document.fonts.ready; } catch { /* system fonts */ }
  let banner = null, logo = null;
  try { banner = await loadImage(BANNER_URL); } catch { /* optional */ }
  try { logo = await loadImage(LOGO_URL); } catch { /* optional */ }

  const meas = document.createElement('canvas').getContext('2d');
  const wrapAt = (text, size, weight, maxW) => { meas.font = `${weight} ${size}px ${FONT}`; return wrap(meas, text, maxW); };
  // Build the date deterministically (short Thai month + B.E. year) so its width
  // is the same on every device — toLocaleDateService('th-TH') varies per system
  // (some add "พ.ศ."/weekday) and can overflow the header.
  const _thM = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const _now = new Date();
  const gen = `${_now.getDate()} ${_thM[_now.getMonth()]} ${_now.getFullYear() + 543}`;

  const sections = [];
  const CPAD = 26; // inner padding of framed cards

  // Framed card: optional title + paragraphs, on a tinted rounded box.
  function card(opts) {
    const innerW = CW - CPAD * 2;
    let h = CPAD;
    let title = null;
    if (opts.title) {
      const lines = wrapAt(opts.title.text, opts.title.size, opts.title.weight, innerW);
      title = { ...opts.title, lines, lh: Math.round(opts.title.size * 1.4) };
      h += lines.length * title.lh + 8;
    }
    const paras = (opts.paras || []).map(p => {
      const lines = wrapAt(p.text, p.size, p.weight, innerW);
      const lh = Math.round(p.size * 1.42);
      h += lines.length * lh + (p.gap == null ? 6 : p.gap);
      return { ...p, lines, lh };
    });
    h += CPAD - 6;
    sections.push({ type: 'card', fill: opts.fill, border: opts.border, title, paras, h: Math.round(h) });
  }

  // ---- letterhead ----
  const logoH = 50, logoW = logo ? Math.round(logoH * (logo.naturalWidth / logo.naturalHeight)) : 0;
  sections.push({ type: 'letterhead', h: 100, logoW, logoH });

  // ---- risk (solid colour box) ----
  sections.push({ type: 'risk', h: 210, color: interp.band.color, headline: interp.headlineTh,
    pct: interp.displayPercentText, band: interp.band.labelTh });

  // ---- meaning ----
  card({ fill: '#f7fafd', border: '#e2ecf5', paras: [
    { text: interp.meaningTh, size: 31, weight: '400', color: INK, gap: 8 },
    { text: interp.meaningNoteTh, size: 22, weight: '400', color: MUTED, gap: 0 },
  ]});

  // ---- inputs used ----
  const inLine = `อายุ ${inputs.age} ปี · ${SEX_TH[inputs.sex] || inputs.sex} · ความดันตัวบน ${inputs.sbp} mmHg · ` +
    `รอบเอว ${inputs.waistCm} ซม. · สูง ${inputs.heightCm} ซม. · ` +
    `${bin(inputs.currentSmoker) ? 'สูบบุหรี่' : 'ไม่สูบบุหรี่'} · ${bin(inputs.diabetes) ? 'เป็นเบาหวาน' : 'ไม่เป็นเบาหวาน'}`;
  card({ fill: '#ffffff', border: '#e2ecf5', title: { text: 'ข้อมูลที่ใช้ประเมิน', size: 23, weight: '700', color: NAVY },
    paras: [{ text: inLine, size: 24, weight: '400', color: '#284b6c', gap: 0 }] });

  // ---- risk drivers ----
  if (reco.drivers.length) {
    card({ fill: '#fff6f5', border: '#f3cdc9', title: { text: 'ปัจจัยเสี่ยงที่ควรใส่ใจ', size: 23, weight: '700', color: '#b3271e' },
      paras: [{ text: reco.drivers.map(d => d.labelTh).join('   ·   '), size: 25, weight: '700', color: '#b3271e', gap: 0 }] });
  }

  // ---- what to do next ----
  if (reco.recommendations.length) {
    card({ fill: '#f1faf4', border: '#c9e8d5', title: { text: 'สิ่งที่ควรทำต่อไป', size: 23, weight: '700', color: '#12614c' },
      paras: reco.recommendations.map(r => ({ text: '•  ' + r.titleTh, size: 24, weight: '700', color: '#12614c', gap: 4 })) });
  }

  // ---- disclaimer ----
  card({ fill: '#fff8ec', border: '#f0dcae', paras: [
    { text: 'แบบประเมินนี้ใช้ช่วยประเมินความเสี่ยงเบื้องต้น ไม่ใช่การวินิจฉัยโรคหรือคำแนะนำการรักษา ควรพิจารณาร่วมกับคำแนะนำของบุคลากรทางการแพทย์',
      size: 21, weight: '400', color: '#6b4d16', gap: 0 }] });

  // ---- footer attribution ----
  const attrText = `${MODEL_META.appName} · ${MODEL_META.moduleName} · Model ${MODEL_META.modelVersion} · ${MODEL_META.attribution} · สร้างเมื่อ ${gen}`;
  const attrLines = wrapAt(attrText, 19, '400', CW);
  sections.push({ type: 'attr', lines: attrLines, size: 19, lh: 26, h: attrLines.length * 26 + 6 });

  // ---- contact banner ----
  if (banner && banner.naturalWidth) {
    sections.push({ type: 'banner', img: banner, gapBefore: 12, h: Math.round(CW * (banner.naturalHeight / banner.naturalWidth)) });
  }

  // ---- total height ----
  let total = TOP;
  sections.forEach((s, i) => { total += (s.gapBefore || 0) + s.h + (i < sections.length - 1 ? GAP : 0); });
  const H = Math.round(total + BOT);

  // ---- draw ----
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'top';

  let y = TOP;
  for (const s of sections) {
    y += (s.gapBefore || 0);
    if (s.type === 'letterhead') {
      if (logo) ctx.drawImage(logo, PAD, y + 2, s.logoW, s.logoH);
      const tx = PAD + (logo ? s.logoW + 22 : 0);
      if (logo) { ctx.strokeStyle = '#d8e5ef'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx - 11, y + 4); ctx.lineTo(tx - 11, y + s.logoH); ctx.stroke(); }
      ctx.textAlign = 'left'; ctx.fillStyle = NAVY; ctx.font = `800 30px ${FONT}`;
      ctx.fillText('HeartCheck Wise', tx, y + 3);
      ctx.fillStyle = MUTED; ctx.font = `400 20px ${FONT}`;
      ctx.fillText('Thai CV Risk Score · ไม่ใช้ผลเลือด', tx, y + 40);
      ctx.textAlign = 'right'; ctx.fillStyle = MUTED; ctx.font = `700 20px ${FONT}`;
      ctx.fillText(gen, W - PAD, y + 12);
      ctx.textAlign = 'left';
      ctx.strokeStyle = '#d8e5ef'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(PAD, y + s.h - 12); ctx.lineTo(W - PAD, y + s.h - 12); ctx.stroke();
    } else if (s.type === 'risk') {
      roundRect(ctx, PAD, y, CW, s.h, 20); ctx.fillStyle = s.color; ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
      ctx.font = `700 25px ${FONT}`; ctx.fillText(s.headline, W / 2, y + 22);
      const pctText = s.pct + '%'; const maxW = CW - 120; let fs = 104;
      ctx.font = `800 ${fs}px ${FONT}`;
      while (fs > 44 && ctx.measureText(pctText).width > maxW) { fs -= 4; ctx.font = `800 ${fs}px ${FONT}`; }
      ctx.textBaseline = 'middle'; ctx.fillText(pctText, W / 2, y + 104);
      ctx.textBaseline = 'top'; ctx.font = `700 34px ${FONT}`;
      ctx.fillText(s.band, W / 2, y + s.h - 46);
      ctx.textAlign = 'left';
    } else if (s.type === 'card') {
      roundRect(ctx, PAD, y, CW, s.h, 16); ctx.fillStyle = s.fill; ctx.fill();
      if (s.border) { ctx.strokeStyle = s.border; ctx.lineWidth = 1.5; ctx.stroke(); }
      let cy = y + CPAD; ctx.textAlign = 'left';
      if (s.title) {
        ctx.font = `${s.title.weight} ${s.title.size}px ${FONT}`; ctx.fillStyle = s.title.color;
        for (const ln of s.title.lines) { ctx.fillText(ln, PAD + CPAD, cy); cy += s.title.lh; }
        cy += 8;
      }
      for (const p of s.paras) {
        ctx.font = `${p.weight} ${p.size}px ${FONT}`; ctx.fillStyle = p.color;
        for (const ln of p.lines) { ctx.fillText(ln, PAD + CPAD, cy); cy += p.lh; }
        cy += (p.gap == null ? 6 : p.gap);
      }
    } else if (s.type === 'attr') {
      ctx.textAlign = 'left'; ctx.font = `400 ${s.size}px ${FONT}`; ctx.fillStyle = MUTED;
      let cy = y; for (const ln of s.lines) { ctx.fillText(ln, PAD, cy); cy += s.lh; }
    } else if (s.type === 'banner') {
      ctx.drawImage(s.img, PAD, y, CW, s.h);
    }
    y += s.h + GAP;
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
