import {
  Answer,
  Question,
  Screen,
  answerTriage,
  beginEmergency,
  chooseCprAge,
  createState,
  goToCprSelect,
  openLocation,
  openScenario,
  openScenarioPicker,
  openSymptoms,
  resetEmergency,
  routeSymptomMatch,
  setLanguage,
  setLocationStatus,
  setSymptomResult,
} from './emergency-state.js';
import { getScenario, quickScenarioIds, routeSymptoms, scenarioGroups, scenarios } from './emergency-data.js';
import { LANGUAGES, getLanguage, hasDirectTranslation, supportedLanguage, translate as t } from './i18n.js';

const app = document.querySelector('#app');
const languageDialog = document.querySelector('#languageDialog');
const languageList = document.querySelector('#languageList');
const languageDialogTitle = document.querySelector('#languageDialogTitle');
const sourcesDialog = document.querySelector('#sourcesDialog');
const sourcesDialogTitle = document.querySelector('#sourcesDialogTitle');
const sourcesContent = document.querySelector('#sourcesContent');
const toast = document.querySelector('#toast');

const storedLanguage = safeStorageGet('nosmo-emergency-language');
const browserLanguage = String(navigator.language || 'en').slice(0, 2).toLowerCase();
const initialLanguage = supportedLanguage(storedLanguage) ? storedLanguage : supportedLanguage(browserLanguage) ? browserLanguage : 'en';
let state = createState(initialLanguage);
let locationReturnScreen = Screen.HOME;
let installPrompt = null;
let toastTimer = null;
let recognition = null;
let speaking = false;
let rhythmTimer = null;
let rhythmAudio = null;
let rhythmActive = false;
let hapticEnabled = true;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

function safeStorageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeStorageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* preference persistence is optional */ }
}

function tr(key, variables) { return t(state.language, key, variables); }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character]));
}

function setDocumentLanguage() {
  const language = getLanguage(state.language);
  document.documentElement.lang = language.locale;
  document.documentElement.dir = language.dir;
  document.title = tr('app_name');
}

function header() {
  const language = getLanguage(state.language);
  return `
    <header class="topbar">
      <div class="brand" aria-label="NOSMO Emergency Button">
        <div class="brand-mark" aria-hidden="true">N</div>
        <div class="brand-copy"><strong>NOSMO</strong><span>${escapeHtml(tr('emergency_help'))}</span></div>
      </div>
      <button class="lang-button" type="button" data-language aria-label="${escapeHtml(tr('current_language'))}: ${escapeHtml(language.nativeName)}">
        <span class="lang-flag" aria-hidden="true">${language.flag}</span><span class="lang-name">${escapeHtml(language.nativeName)}</span>
      </button>
    </header>`;
}

function stickyEmergencyBar() {
  if (!state.emergencyActive) return '';
  const language = getLanguage(state.language);
  return `
    <div class="emergency-sticky" role="region" aria-label="${escapeHtml(tr('emergency_mode'))}">
      <div class="active-line">
        <span class="active-pill">● ${escapeHtml(tr('emergency_mode'))}</span>
        <div class="sticky-tools">
          <button class="mini-button" type="button" data-location aria-label="${escapeHtml(tr('location'))}">⌖</button>
          <button class="mini-button" type="button" data-language aria-label="${escapeHtml(tr('current_language'))}: ${escapeHtml(language.nativeName)}">${language.flag}</button>
          <button class="mini-button" type="button" data-reset aria-label="${escapeHtml(tr('reset_emergency'))}">×</button>
        </div>
      </div>
      <div class="sticky-actions">
        <button class="sticky-call" type="button" data-call="999">☎ ${escapeHtml(tr('call_999'))}</button>
        <button class="sticky-call secondary" type="button" data-call="112">☎ ${escapeHtml(tr('call_112'))}</button>
      </div>
    </div>`;
}

function renderHome() {
  const quick = quickScenarioIds.map((id) => {
    const scenario = scenarios[id];
    return `<button class="tile critical" type="button" data-scenario="${id}"><span class="tile-icon" aria-hidden="true">${scenario.icon}</span><span>${escapeHtml(tr(scenario.titleKey))}</span></button>`;
  }).join('');
  const installControl = isStandalone
    ? `<div class="utility-button install" role="status">✓ ${escapeHtml(tr('installed'))}</div>`
    : installPrompt
      ? `<button class="utility-button install" type="button" data-install>＋ ${escapeHtml(tr('install_app'))}</button>`
      : '';
  return `
    ${header()}
    <div class="safety-strip"><strong>999 / 112:</strong> ${escapeHtml(tr('safety_disclaimer'))}</div>
    <main>
      <section class="activation-wrap" aria-label="${escapeHtml(tr('emergency_button'))}">
        <button class="emergency-button" type="button" data-emergency aria-describedby="emergencyTruth">
          <span class="sos">SOS</span><span class="emergency-word">${escapeHtml(tr('emergency_button'))}</span><span class="press">${escapeHtml(tr('press_for_help'))}</span>
        </button>
      </section>
      <div class="call-grid" id="emergencyTruth">
        <button class="call-button primary" type="button" data-call="999"><span aria-hidden="true">☎</span>${escapeHtml(tr('call_999'))}</button>
        <button class="call-button" type="button" data-call="112"><span aria-hidden="true">☎</span>${escapeHtml(tr('call_112'))}</button>
      </div>
      <h2 class="section-title">${escapeHtml(tr('quick_help'))}</h2>
      <div class="quick-grid">
        <button class="tile critical" type="button" data-cpr-select><span class="tile-icon" aria-hidden="true">♥</span><span>${escapeHtml(tr('cpr_not_breathing'))}</span></button>
        ${quick}
        <button class="tile full accent" type="button" data-symptoms><span class="tile-icon" aria-hidden="true">⌨</span><span>${escapeHtml(tr('describe_symptoms'))}</span></button>
        <button class="tile full" type="button" data-picker><span class="tile-icon" aria-hidden="true">＋</span><span>${escapeHtml(tr('more_emergencies'))}</span></button>
      </div>
      <div class="utility-row">
        <button class="utility-button" type="button" data-location>⌖ ${escapeHtml(tr('location'))}</button>
        ${installControl}
      </div>
      <div class="offline-badge">✓ ${escapeHtml(tr('offline_ready'))}</div>
      <div class="footer-actions"><button class="link-button" type="button" data-sources>${escapeHtml(tr('sources'))}</button></div>
    </main>`;
}

const questionMap = {
  [Question.SCENE_SAFE]: ['question_scene_title', 'question_scene_detail'],
  [Question.RESPONSIVE]: ['question_responsive_title', 'question_responsive_detail'],
  [Question.BREATHING]: ['question_breathing_title', 'question_breathing_detail'],
  [Question.SEVERE_BLEEDING]: ['question_bleeding_title', 'question_bleeding_detail'],
};

function renderTriage() {
  const [titleKey, detailKey] = questionMap[state.triage.currentQuestion] || [];
  const unresponsive = state.triage.currentQuestion === Question.BREATHING && state.triage.answers[Question.RESPONSIVE] !== Answer.YES;
  const stepNumber = [Question.SCENE_SAFE, Question.RESPONSIVE, Question.BREATHING, Question.SEVERE_BLEEDING].indexOf(state.triage.currentQuestion) + 1;
  return `
    ${header()}${stickyEmergencyBar()}
    ${unresponsive ? `<div class="alert-banner" role="alert">☎ ${escapeHtml(tr('unresponsive_call_banner'))}</div>` : ''}
    <main class="question-card">
      <div class="step-eyebrow">${escapeHtml(tr('step_label'))} ${stepNumber}</div>
      <h1>${escapeHtml(tr(titleKey))}</h1>
      <p>${escapeHtml(tr(detailKey))}</p>
      <div class="answer-stack" aria-label="Answer choices">
        <button class="answer-button yes" type="button" data-answer="YES">${escapeHtml(tr('yes'))}</button>
        <button class="answer-button no" type="button" data-answer="NO">${escapeHtml(tr('no'))}</button>
        <button class="answer-button unknown" type="button" data-answer="UNKNOWN">${escapeHtml(tr('unknown'))}</button>
      </div>
    </main>`;
}

function renderPicker() {
  const groups = scenarioGroups.map((group) => {
    const buttons = group.scenarioIds.map((id) => {
      const scenario = getScenario(id);
      if (!scenario) return '';
      return `<button class="scenario-button ${scenario.lifeThreatening ? 'life' : ''}" type="button" data-scenario="${id}">
        <span class="scenario-icon" aria-hidden="true">${scenario.icon}</span><span>${escapeHtml(tr(scenario.titleKey))}</span>${scenario.lifeThreatening ? `<span class="risk">999</span>` : ''}
      </button>`;
    }).join('');
    return `<section class="scenario-group"><h2>${escapeHtml(tr(group.titleKey))}</h2><div class="scenario-list">${buttons}</div></section>`;
  }).join('');
  return `
    ${header()}${stickyEmergencyBar()}
    <main>
      <div class="screen-head"><button class="back-button" type="button" data-back aria-label="${escapeHtml(tr('back'))}">←</button><div><h1>${escapeHtml(tr('pick_title'))}</h1><p>${escapeHtml(tr('pick_detail'))}</p></div></div>
      <button class="tile full accent" type="button" data-symptoms><span class="tile-icon" aria-hidden="true">⌨</span><span>${escapeHtml(tr('describe_symptoms'))}</span></button>
      <div class="picker-groups" style="margin-top:18px">${groups}</div>
    </main>`;
}

function scenarioSteps(scenario) {
  return scenario.steps.map((key) => {
    const fallback = state.language !== 'en' && !hasDirectTranslation(state.language, key);
    return `<div class="guidance-step ${fallback ? 'fallback' : ''}"><div><p>${escapeHtml(tr(key))}</p>${fallback ? `<span class="fallback-note">EN: ${escapeHtml(tr('english_fallback'))}</span>` : ''}</div></div>`;
  }).join('');
}

function renderScenario() {
  const scenario = getScenario(state.scenarioId);
  if (!scenario) return renderPicker();
  return `
    ${header()}${stickyEmergencyBar()}
    <main>
      <div class="screen-head"><button class="back-button" type="button" data-back aria-label="${escapeHtml(tr('back'))}">←</button></div>
      <section class="scenario-hero ${scenario.lifeThreatening ? 'life' : ''}">
        <div class="scenario-icon-large" aria-hidden="true">${scenario.icon}</div>
        <h1>${escapeHtml(tr(scenario.titleKey))}</h1>
        <p class="operator">${escapeHtml(tr('operator_priority'))}</p>
      </section>
      <div class="guidance-list">${scenarioSteps(scenario)}</div>
      ${scenario.emergencyCriteriaKey ? `<div class="criteria-card"><strong>${escapeHtml(tr('emergency_criteria'))}</strong>${escapeHtml(tr(scenario.emergencyCriteriaKey))}</div>` : ''}
      <div class="scenario-actions">
        <button class="action-button blue" type="button" data-read>🔊 ${escapeHtml(tr('read_aloud'))}</button>
        <button class="action-button" type="button" data-location>⌖ ${escapeHtml(tr('location'))}</button>
      </div>
    </main>`;
}

function renderCprSelect() {
  return `
    ${header()}${stickyEmergencyBar()}
    <main>
      <div class="screen-head"><button class="back-button" type="button" data-back aria-label="${escapeHtml(tr('back'))}">←</button><div><h1>${escapeHtml(tr('cpr_choose_title'))}</h1><p>${escapeHtml(tr('cpr_choose_detail'))}</p></div></div>
      <div class="alert-banner">☎ ${escapeHtml(tr('call_now'))}: 999 / 112</div>
      <div class="cpr-age-grid">
        <button class="age-button" type="button" data-cpr-age="adult"><strong>${escapeHtml(tr('adult'))}</strong><span>${escapeHtml(tr('adult_age'))}</span></button>
        <button class="age-button" type="button" data-cpr-age="child"><strong>${escapeHtml(tr('child'))}</strong><span>${escapeHtml(tr('child_age'))}</span></button>
        <button class="age-button" type="button" data-cpr-age="infant"><strong>${escapeHtml(tr('infant'))}</strong><span>${escapeHtml(tr('infant_age'))}</span></button>
      </div>
    </main>`;
}

function renderCpr() {
  const scenario = getScenario(state.scenarioId);
  if (!scenario) return renderCprSelect();
  return `
    ${header()}${stickyEmergencyBar()}
    <main>
      <div class="screen-head"><button class="back-button" type="button" data-back aria-label="${escapeHtml(tr('back'))}">←</button><div><h1>${escapeHtml(tr('cpr_title'))}</h1></div></div>
      <section class="scenario-hero life"><div class="scenario-icon-large" aria-hidden="true">♥</div><h1>${escapeHtml(tr(scenario.titleKey))}</h1><p class="operator">${escapeHtml(tr('operator_priority'))}</p></section>
      <section class="rhythm-panel" aria-label="CPR compression rhythm">
        <div id="rhythmOrb" class="rhythm-orb" aria-hidden="true">110</div>
        <button class="rhythm-button" type="button" data-rhythm aria-pressed="${rhythmActive}">${escapeHtml(tr(rhythmActive ? 'stop_rhythm' : 'start_rhythm'))}</button>
        <p class="rhythm-note">${escapeHtml(tr('rhythm_note'))}</p>
      </section>
      <div class="guidance-list">${scenarioSteps(scenario)}</div>
      <div class="scenario-actions">
        <button class="action-button blue" type="button" data-read>🔊 ${escapeHtml(tr('read_aloud'))}</button>
        <button class="action-button" type="button" data-haptic>${escapeHtml(tr(hapticEnabled ? 'haptic_on' : 'haptic_off'))}</button>
      </div>
    </main>`;
}

function renderSymptoms() {
  return `
    ${header()}${stickyEmergencyBar()}
    <main>
      <div class="screen-head"><button class="back-button" type="button" data-back aria-label="${escapeHtml(tr('back'))}">←</button><div><h1>${escapeHtml(tr('describe_symptoms'))}</h1></div></div>
      <div class="symptom-box">
        <textarea id="symptomInput" autocomplete="off" autocapitalize="sentences" spellcheck="true" placeholder="${escapeHtml(tr('search_placeholder'))}" aria-label="${escapeHtml(tr('describe_symptoms'))}">${escapeHtml(state.symptomQuery)}</textarea>
        <div class="symptom-actions">
          <button class="search-button" type="button" data-route-symptoms>${escapeHtml(tr('search_action'))}</button>
          <button class="voice-button" type="button" data-voice-input ${SpeechRecognition ? '' : 'disabled'}>${SpeechRecognition ? '🎙 ' + escapeHtml(tr('voice_input')) : escapeHtml(tr('voice_unavailable'))}</button>
        </div>
        <p class="privacy-note">${escapeHtml(tr('symptom_privacy'))}</p>
      </div>
      ${state.symptomMatch === false ? `<div class="no-match" role="status"><h2>${escapeHtml(tr('no_match_title'))}</h2><p>${escapeHtml(tr('no_match_detail'))}</p><button class="action-button" style="width:100%;margin-top:12px" type="button" data-picker>${escapeHtml(tr('more_emergencies'))}</button></div>` : ''}
    </main>`;
}

function renderLocation() {
  const location = state.location;
  let statusText = tr('location_idle');
  if (location.status === 'LOCATING') statusText = tr('locating');
  if (location.status === 'AVAILABLE') statusText = tr('location_ready');
  if (location.status === 'DENIED') statusText = tr('location_denied');
  if (location.status === 'UNAVAILABLE') statusText = tr('location_unavailable');
  const coords = location.status === 'AVAILABLE' ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : '—';
  return `
    ${header()}${stickyEmergencyBar()}
    <main>
      <div class="screen-head"><button class="back-button" type="button" data-location-back aria-label="${escapeHtml(tr('back'))}">←</button><div><h1>${escapeHtml(tr('location'))}</h1></div></div>
      <section class="location-card">
        <div class="location-status">${escapeHtml(statusText)}</div>
        <div class="location-coords" aria-live="assertive">${escapeHtml(coords)}</div>
        <div class="location-accuracy">${location.status === 'AVAILABLE' ? `${escapeHtml(tr('accuracy'))}: ±${Math.round(location.accuracyMetres)} m` : ''}</div>
        <button class="location-main" type="button" data-get-location>⌖ ${escapeHtml(tr('get_location'))}</button>
        ${location.status === 'AVAILABLE' ? `<div class="location-actions"><button class="location-action" type="button" data-copy-location>${escapeHtml(tr('copy_location'))}</button><button class="location-action" type="button" data-share-location>${escapeHtml(tr('share_location'))}</button></div>` : ''}
        <p class="privacy-note">${escapeHtml(tr('location_privacy'))}</p>
      </section>
    </main>`;
}

function render() {
  setDocumentLanguage();
  if (state.screen !== Screen.CPR && rhythmActive) stopRhythm();
  if (state.screen === Screen.HOME) app.innerHTML = renderHome();
  else if (state.screen === Screen.TRIAGE) app.innerHTML = renderTriage();
  else if (state.screen === Screen.PICK_SCENARIO) app.innerHTML = renderPicker();
  else if (state.screen === Screen.SCENARIO) app.innerHTML = renderScenario();
  else if (state.screen === Screen.CPR_SELECT) app.innerHTML = renderCprSelect();
  else if (state.screen === Screen.CPR) app.innerHTML = renderCpr();
  else if (state.screen === Screen.SYMPTOMS) app.innerHTML = renderSymptoms();
  else if (state.screen === Screen.LOCATION) app.innerHTML = renderLocation();
  else app.innerHTML = renderHome();
  window.scrollTo({ top:0, behavior:'instant' });
}

function callEmergency(number) {
  stopSpeech();
  showToast(`${number} — ${tr('opens_dialler')}`);
  window.location.href = `tel:${number}`;
}

function startEmergency() {
  stopSpeech();
  state = beginEmergency(state);
  if (navigator.vibrate) navigator.vibrate([70, 40, 70]);
  render();
}

function openLanguageDialog() {
  languageDialogTitle.textContent = tr('current_language');
  languageList.innerHTML = LANGUAGES.map((language) => `<button class="language-option" type="button" data-language-code="${language.code}" aria-current="${state.language === language.code}"><span class="flag" aria-hidden="true">${language.flag}</span><span class="lang-meta"><span class="native">${escapeHtml(language.nativeName)}</span><span class="english">${escapeHtml(language.name)}</span></span></button>`).join('');
  showDialog(languageDialog);
}

function chooseLanguage(code) {
  if (!supportedLanguage(code)) return;
  state = setLanguage(state, code);
  safeStorageSet('nosmo-emergency-language', code);
  closeDialog(languageDialog);
  render();
}

function openSourcesDialog() {
  sourcesDialogTitle.textContent = tr('sources');
  sourcesContent.innerHTML = `
    <div class="source-badge"><strong>${escapeHtml(tr('not_replacement'))}</strong><p>${escapeHtml(tr('safety_disclaimer'))}</p></div>
    <p>${escapeHtml(tr('source_detail'))}</p>
    <p>${escapeHtml(tr('source_review'))}</p>
    <h3>UK source set</h3>
    <ul>
      <li>Resuscitation Council UK — 2025 Resuscitation Guidelines, Adult Basic Life Support, Paediatric Basic Life Support, First Aid.</li>
      <li>NHS — first aid, stroke, heart attack, seizures, poisoning and burns guidance.</li>
      <li>British Red Cross — first aid guidance.</li>
      <li>St John Ambulance — first aid advice.</li>
    </ul>
    <p>${escapeHtml(tr('source_footer'))}</p>`;
  showDialog(sourcesDialog);
}

function showDialog(dialog) {
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
}
function closeDialog(dialog) {
  if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
}

function goBack() {
  stopSpeech();
  if (state.screen === Screen.SCENARIO || state.screen === Screen.CPR_SELECT || state.screen === Screen.CPR) {
    state = { ...state, screen: Screen.PICK_SCENARIO, scenarioId:null, cprAge:null };
  } else if (state.screen === Screen.PICK_SCENARIO) {
    if (state.emergencyActive) state = resetEmergency(state); else state = { ...state, screen:Screen.HOME };
  } else if (state.screen === Screen.SYMPTOMS) {
    state = { ...state, screen: state.emergencyActive ? Screen.PICK_SCENARIO : Screen.HOME, symptomMatch:null };
  } else {
    state = { ...state, screen:Screen.HOME };
  }
  render();
}

function endEmergency() {
  if (!window.confirm(tr('reset_confirm'))) return;
  stopSpeech();
  stopRhythm();
  state = resetEmergency(state);
  render();
}

function openLocationScreen() {
  if (state.screen !== Screen.LOCATION) locationReturnScreen = state.screen;
  state = openLocation(state);
  render();
}
function returnFromLocation() {
  state = { ...state, screen: locationReturnScreen || Screen.HOME };
  render();
}

function requestLocation() {
  if (!navigator.geolocation) {
    state = setLocationStatus(state, { status:'UNAVAILABLE', latitude:null, longitude:null, accuracyMetres:null });
    render();
    return;
  }
  state = setLocationStatus(state, { status:'LOCATING' });
  render();
  navigator.geolocation.getCurrentPosition(
    (position) => {
      state = setLocationStatus(state, { status:'AVAILABLE', latitude:position.coords.latitude, longitude:position.coords.longitude, accuracyMetres:position.coords.accuracy });
      render();
    },
    (error) => {
      state = setLocationStatus(state, { status:error.code === error.PERMISSION_DENIED ? 'DENIED' : 'UNAVAILABLE', latitude:null, longitude:null, accuracyMetres:null });
      render();
    },
    { enableHighAccuracy:true, timeout:8000, maximumAge:15000 },
  );
}

function locationText() {
  if (state.location.status !== 'AVAILABLE') return '';
  return `Latitude ${state.location.latitude.toFixed(6)}, longitude ${state.location.longitude.toFixed(6)}, accuracy approximately ${Math.round(state.location.accuracyMetres)} metres`;
}
async function copyLocation() {
  const text = locationText();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast(tr('copied'));
  } catch {
    fallbackCopy(text);
    showToast(tr('copied'));
  }
}
async function shareLocation() {
  const text = locationText();
  if (!text) return;
  if (navigator.share) {
    try { await navigator.share({ title:'Emergency location', text }); return; } catch (error) { if (error?.name === 'AbortError') return; }
  }
  await copyLocation();
  showToast(tr('share_not_supported'));
}
function fallbackCopy(text) {
  const area = document.createElement('textarea');
  area.value = text; area.setAttribute('readonly', ''); area.style.position='fixed'; area.style.opacity='0'; document.body.append(area); area.select();
  try { document.execCommand('copy'); } catch { /* browser may deny clipboard */ }
  area.remove();
}

function routeSymptomsNow() {
  const input = document.querySelector('#symptomInput');
  const query = String(input?.value || state.symptomQuery || '').trim();
  const match = routeSymptoms(query);
  state = setSymptomResult(state, query, match || false);
  if (match) state = routeSymptomMatch(state, match);
  render();
}

function startVoiceInput() {
  if (!SpeechRecognition) return;
  stopSpeech();
  recognition?.abort();
  recognition = new SpeechRecognition();
  recognition.lang = getLanguage(state.language).locale;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;
  const button = document.querySelector('[data-voice-input]');
  if (button) button.textContent = tr('listening');
  recognition.addEventListener('result', (event) => {
    const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
    const input = document.querySelector('#symptomInput');
    if (input) input.value = transcript;
    state = { ...state, symptomQuery: transcript };
    routeSymptomsNow();
  });
  recognition.addEventListener('error', () => { showToast(tr('voice_unavailable')); render(); });
  recognition.addEventListener('end', () => { recognition = null; });
  try { recognition.start(); } catch { showToast(tr('voice_unavailable')); }
}

function readCurrentGuidance() {
  const scenario = getScenario(state.scenarioId);
  if (!scenario || !('speechSynthesis' in window)) return;
  if (speaking) { stopSpeech(); render(); return; }
  const language = getLanguage(state.language);
  const words = [tr(scenario.titleKey), tr('operator_priority'), ...scenario.steps.map((key) => tr(key))].join('. ');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(words);
  utterance.lang = language.locale;
  const voices = window.speechSynthesis.getVoices();
  const prefix = language.locale.slice(0, 2).toLowerCase();
  const voice = voices.find((candidate) => candidate.lang?.toLowerCase().startsWith(prefix));
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9;
  utterance.addEventListener('end', () => { speaking = false; render(); });
  utterance.addEventListener('error', () => { speaking = false; });
  speaking = true;
  window.speechSynthesis.speak(utterance);
}
function stopSpeech() {
  recognition?.abort(); recognition = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  speaking = false;
}

function startRhythm() {
  if (rhythmActive) { stopRhythm(); render(); return; }
  rhythmActive = true;
  const interval = Math.round(60000 / 110);
  let beatCount = 0;
  const beat = () => {
    const orb = document.querySelector('#rhythmOrb');
    if (orb) { orb.classList.add('beat'); window.setTimeout(() => orb.classList.remove('beat'), 105); }
    beep();
    beatCount += 1;
    if (hapticEnabled && navigator.vibrate && beatCount % 2 === 0) navigator.vibrate(35);
  };
  beat();
  rhythmTimer = window.setInterval(beat, interval);
  render();
}
function stopRhythm() {
  if (rhythmTimer) window.clearInterval(rhythmTimer);
  rhythmTimer = null; rhythmActive = false;
  if (rhythmAudio) { rhythmAudio.close().catch(() => {}); rhythmAudio = null; }
  if (navigator.vibrate) navigator.vibrate(0);
}
function beep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!rhythmAudio) rhythmAudio = new AudioContext();
    const oscillator = rhythmAudio.createOscillator();
    const gain = rhythmAudio.createGain();
    oscillator.frequency.value = 740;
    gain.gain.setValueAtTime(0.13, rhythmAudio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, rhythmAudio.currentTime + 0.07);
    oscillator.connect(gain).connect(rhythmAudio.destination);
    oscillator.start(); oscillator.stop(rhythmAudio.currentTime + 0.075);
  } catch { /* visual rhythm remains available */ }
}

async function installApp() {
  if (!installPrompt) { showToast(tr('install_unavailable')); return; }
  const prompt = installPrompt;
  installPrompt = null;
  await prompt.prompt();
  try { await prompt.userChoice; } catch { /* browser-specific */ }
  render();
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3600);
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.call) return callEmergency(button.dataset.call);
  if (button.hasAttribute('data-emergency')) return startEmergency();
  if (button.hasAttribute('data-language')) return openLanguageDialog();
  if (button.hasAttribute('data-sources')) return openSourcesDialog();
  if (button.hasAttribute('data-cpr-select')) { state = goToCprSelect(state); return render(); }
  if (button.dataset.cprAge) { state = chooseCprAge(state, button.dataset.cprAge); return render(); }
  if (button.dataset.scenario) { state = openScenario(state, button.dataset.scenario); return render(); }
  if (button.hasAttribute('data-picker')) { state = openScenarioPicker(state); return render(); }
  if (button.hasAttribute('data-symptoms')) { state = openSymptoms(state); return render(); }
  if (button.dataset.answer) { state = answerTriage(state, Answer[button.dataset.answer]); return render(); }
  if (button.hasAttribute('data-back')) return goBack();
  if (button.hasAttribute('data-reset')) return endEmergency();
  if (button.hasAttribute('data-location')) return openLocationScreen();
  if (button.hasAttribute('data-location-back')) return returnFromLocation();
  if (button.hasAttribute('data-get-location')) return requestLocation();
  if (button.hasAttribute('data-copy-location')) return void copyLocation();
  if (button.hasAttribute('data-share-location')) return void shareLocation();
  if (button.hasAttribute('data-route-symptoms')) return routeSymptomsNow();
  if (button.hasAttribute('data-voice-input')) return startVoiceInput();
  if (button.hasAttribute('data-read')) return readCurrentGuidance();
  if (button.hasAttribute('data-rhythm')) return startRhythm();
  if (button.hasAttribute('data-haptic')) { hapticEnabled = !hapticEnabled; return render(); }
  if (button.hasAttribute('data-install')) return void installApp();
});

languageList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-language-code]');
  if (button) chooseLanguage(button.dataset.languageCode);
});
document.querySelector('[data-close-language]').addEventListener('click', () => closeDialog(languageDialog));
document.querySelector('[data-close-sources]').addEventListener('click', () => closeDialog(sourcesDialog));

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  if (state.screen === Screen.HOME) render();
});
window.addEventListener('appinstalled', () => { installPrompt = null; showToast(tr('installed')); render(); });
window.addEventListener('beforeunload', () => { stopSpeech(); stopRhythm(); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
}

render();
