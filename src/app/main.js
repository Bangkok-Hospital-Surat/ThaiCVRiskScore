/**
 * main.js — view controller for HeartCheck Wise – Thai CV (Non-Lab).
 * Client-side only. No network calls (enforced by CSP connect-src 'none').
 */
import { EligibilityForm, RiskInputForm } from '../components/InputForm.js';
import { ResultCard } from '../components/ResultCard.js';
import { ReferencesView } from '../components/ReferencesView.js';
import { checkAscvdEligibility, validateInputs, assessEligibility, INELIGIBLE_MESSAGE_TH } from '../eligibility/eligibilityRules.js';
import { getActiveModel } from '../calculator/riskModels.js';
import { interpretRisk } from '../interpretation/riskInterpretation.js';
import { buildRecommendations } from '../interpretation/recommendationRules.js';
import { MODEL_META } from '../config/references.js';
import { shareOrDownloadSummary } from './exportSummary.js';

const app = document.getElementById('app');
const state = {
  view: 'intro',
  prevView: 'intro',
  eligAnswers: {},
  inputs: { sex: null, smoke: '0', dm: '0' }
};

/* ---------------- views ---------------- */
function IntroView() {
  return `
  <div class="hero">
    <div class="eyebrow">HEARTCHECK WISE · THAI CV</div>
    <h1>ประเมินความเสี่ยงโรคหัวใจและหลอดเลือด<wbr><span class="nowrap">ใน 10 ปี</span></h1>
    <p class="tagline">รู้ความเสี่ยงหัวใจของคุณ โดยไม่ต้องรอผลเลือด</p>
    <div class="hero-badges">
      <span>ไม่ต้องเจาะเลือด</span>
      <span>คำนวณบนเครื่องของคุณ</span>
      <span>อ้างอิง Thai CV Risk Score</span>
    </div>
  </div>
  <div class="card">
    <h2>เริ่มต้นประเมิน</h2>
    <p class="muted">ใช้ข้อมูลพื้นฐาน 7 อย่าง ได้แก่ อายุ เพศ การสูบบุหรี่ เบาหวาน ความดันโลหิตตัวบน รอบเอว และส่วนสูง
      ใช้เวลาประมาณ 1–2 นาที</p>
    <div class="actions">
      <button class="secondary" data-action="show-refs">หลักฐานและที่มา</button>
      <button class="primary" data-action="to-eligibility">เริ่มประเมิน</button>
    </div>
  </div>`;
}

function IneligibleView() {
  const reasons = checkAscvdEligibility(state.eligAnswers).reasons
    .map(r => `<li>${r}</li>`).join('');
  return `
  <div class="card safety-card">
    <h2>แบบประเมินนี้อาจไม่เหมาะกับท่าน</h2>
    <div class="alert danger">${INELIGIBLE_MESSAGE_TH}</div>
    <p class="muted">ข้อที่ท่านเลือก:</p>
    <ul>${reasons}</ul>
    <div class="actions">
      <button class="secondary" data-action="to-eligibility">ย้อนกลับ</button>
      <button class="secondary" data-action="restart">เริ่มใหม่</button>
    </div>
  </div>`;
}

function Stepper(step) {
  const s = k => (step === k ? 'active' : step > k ? 'done' : '');
  if (step === 0) return '';
  return `<div class="steps">
    <span class="${s(1)}">1</span><i></i><span class="${s(2)}">2</span>
  </div>`;
}

function render() {
  let body = '', step = 0;
  switch (state.view) {
    case 'intro':        body = IntroView(); break;
    case 'eligibility':  step = 1; body = EligibilityForm(); break;
    case 'inputs':       step = 2; body = RiskInputForm(); break;
    case 'ineligible':   body = IneligibleView(); break;
    case 'result':       body = state.resultHtml; break;
    case 'references':   body = ReferencesView(); break;
  }
  app.innerHTML = Stepper(step) + body;
  restoreInputs();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  postHeight();
}

/* --------------- iframe auto-resize (for embedding on the hospital website) ---
 * Sends the document height to the parent page so the embedding <iframe> can
 * resize to fit (no inner scrollbar). Only a height number is sent — never any
 * health data. type must match the parent's listener exactly. */
function postHeight() {
  try {
    const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    parent.postMessage({ type: 'bsr-thaicv-height', height: h }, '*');
  } catch (e) { /* not framed / blocked */ }
}
window.addEventListener('load', postHeight);
window.addEventListener('resize', postHeight);
if (window.ResizeObserver) { new ResizeObserver(postHeight).observe(document.body); }
else { setInterval(postHeight, 600); }

/* --------------- input persistence --------------- */
function restoreInputs() {
  if (state.view !== 'inputs') return;
  const i = state.inputs;
  setVal('in-age', i.age); setVal('in-sbp', i.sbp);
  setVal('in-waist', i.waistCm); setVal('in-height', i.heightCm);
  markSeg('sex', i.sex); markSeg('smoke', i.smoke); markSeg('dm', i.dm);
}
function setVal(id, v) { const el = document.getElementById(id); if (el && v != null) el.value = v; }
function markSeg(name, val) {
  document.querySelectorAll(`[data-seg="${name}"] label`).forEach(l => {
    const on = l.getAttribute('data-val') === String(val);
    l.classList.toggle('on', on);
    const input = l.querySelector('input'); if (input) input.checked = on;
  });
}

function collectInputs() {
  return {
    age: numOrNull('in-age'),
    sbp: numOrNull('in-sbp'),
    waistCm: numOrNull('in-waist'),
    heightCm: numOrNull('in-height'),
    sex: state.inputs.sex,
    currentSmoker: state.inputs.smoke,
    diabetes: state.inputs.dm
  };
}
function numOrNull(id) { const el = document.getElementById(id); const v = el && el.value !== '' ? Number(el.value) : null; return v; }

/* --------------- actions --------------- */
function calculate() {
  // persist current field values
  const inp = collectInputs();
  state.inputs = { ...state.inputs, age: inp.age, sbp: inp.sbp, waistCm: inp.waistCm, heightCm: inp.heightCm };

  const gate = assessEligibility(state.eligAnswers, inp);
  clearErrors();
  if (!gate.ascvd.eligible) { state.view = 'ineligible'; return render(); }
  if (!gate.inputs.ok) { showErrors(gate.inputs.errors); return; }

  const model = getActiveModel();
  const result = model.compute(inp);
  if (!result.valid) { showErrors([{ field: 'age', message: 'ข้อมูลไม่ครบหรืออยู่นอกช่วงที่ประเมินได้' }]); return; }

  const interp = interpretRisk(result);
  const reco = buildRecommendations(inp);
  state.lastResult = { interp, reco, inputs: inp };  // for export
  state.resultHtml = ResultCard(interp, reco);
  state.view = 'result';
  render();
}

function showErrors(errors) {
  errors.forEach(e => {
    const el = document.querySelector(`[data-err="${e.field}"]`);
    if (el) { el.textContent = e.message; el.hidden = false; }
  });
  const first = document.querySelector('.field-error:not([hidden])');
  if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => { el.hidden = true; el.textContent = ''; });
}

async function handleExport(btn, format) {
  if (!state.lastResult) return;
  const original = btn.textContent;
  const noun = format === 'pdf' ? 'PDF' : 'รูป';
  btn.disabled = true; btn.textContent = `กำลังสร้าง${noun}…`;
  try {
    const res = await shareOrDownloadSummary(state.lastResult, format);
    btn.textContent = res.method === 'download' ? `✅ บันทึก${noun}แล้ว` : original;
  } catch (e) {
    btn.textContent = `⚠️ สร้าง${noun}ไม่สำเร็จ`;
  } finally {
    setTimeout(() => { btn.disabled = false; btn.textContent = original; }, 2500);
  }
}

/* --------------- event delegation --------------- */
app.addEventListener('click', e => {
  // segmented controls
  const segLabel = e.target.closest('.seg label');
  if (segLabel) {
    const name = segLabel.closest('.seg').getAttribute('data-seg');
    const val = segLabel.getAttribute('data-val');
    state.inputs[name] = val;
    markSeg(name, val);
    const err = document.querySelector(`[data-err="${name}"]`); if (err) err.hidden = true;
    return;
  }
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  switch (action) {
    case 'to-intro':       state.view = 'intro'; render(); break;
    case 'to-eligibility': state.view = 'eligibility'; render(); break;
    case 'to-inputs':
      collectEligibility();
      if (!checkAscvdEligibility(state.eligAnswers).eligible) { state.view = 'ineligible'; }
      else { state.view = 'inputs'; }
      render(); break;
    case 'calculate':      calculate(); break;
    case 'restart':
      state.eligAnswers = {}; state.inputs = { sex: null, smoke: '0', dm: '0' };
      state.view = 'intro'; render(); break;
    case 'show-refs':      state.prevView = state.view; state.view = 'references'; render(); break;
    case 'back-from-refs': state.view = state.prevView || 'intro'; render(); break;
    case 'save-pdf':       handleExport(btn, 'pdf'); break;
    case 'share-image':    handleExport(btn, 'png'); break;
  }
});

function collectEligibility() {
  document.querySelectorAll('[data-elig]').forEach(cb => {
    state.eligAnswers[cb.getAttribute('data-elig')] = cb.checked;
  });
}

/* --------------- footer version stamp --------------- */
const stamp = document.getElementById('version-stamp');
if (stamp) {
  stamp.innerHTML =
    `<strong>${MODEL_META.appName}</strong> · ${MODEL_META.moduleName} · Model ${MODEL_META.modelVersion}<br>` +
    `${MODEL_META.attribution}`;
}

render();
