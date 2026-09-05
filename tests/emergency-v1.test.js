import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import {
  Answer, Question, Screen, answerTriage, beginEmergency, createState, setLanguage,
} from '../src/emergency-state.js';
import { getScenario, routeSymptoms, scenarios } from '../src/emergency-data.js';
import { LANGUAGES, getPack, hasDirectTranslation } from '../src/i18n.js';

function routeTriage(...answers) {
  let state = beginEmergency(createState('en'));
  for (const answer of answers) state = answerTriage(state, answer);
  return state;
}

test('CASE 1: unconscious and not breathing routes immediately to CPR age selection', () => {
  const state = routeTriage(Answer.YES, Answer.NO, Answer.NO);
  assert.equal(state.screen, Screen.CPR_SELECT);
  assert.equal(state.emergencyActive, true);
  assert.equal(state.triage.answers[Question.RESPONSIVE], Answer.NO);
  assert.equal(state.triage.answers[Question.BREATHING], Answer.NO);
});

test('CASE 2: unconscious but breathing routes to recovery-position guidance', () => {
  const state = routeTriage(Answer.YES, Answer.NO, Answer.YES);
  assert.equal(state.screen, Screen.SCENARIO);
  assert.equal(state.scenarioId, 'unconscious_breathing');
  assert.ok(getScenario(state.scenarioId).steps.includes('recovery_position'));
});

test('CASE 3: severe bleeding routes to emergency bleeding control', () => {
  const state = routeTriage(Answer.YES, Answer.YES, Answer.YES);
  assert.equal(state.scenarioId, 'severe_bleeding');
  assert.equal(getScenario('severe_bleeding').lifeThreatening, true);
  assert.ok(getScenario('severe_bleeding').steps.includes('bleed_direct_pressure'));
});

test('CASE 4: choking free text routes to choking guidance', () => {
  assert.equal(routeSymptoms('He is choking on food').scenarioId, 'choking_adult');
  assert.equal(routeSymptoms('on sie dławi').scenarioId, 'choking_adult');
});

test('CASE 5: possible stroke routes to FAST guidance', () => {
  const match = routeSymptoms('Face drooping and slurred speech possible stroke');
  assert.equal(match.scenarioId, 'stroke');
  assert.ok(getScenario('stroke').steps.includes('stroke_fast'));
});

test('CASE 6: chest pain / suspected heart attack routes to emergency guidance', () => {
  const match = routeSymptoms('sudden chest pain possible heart attack');
  assert.equal(match.scenarioId, 'chest_pain');
  assert.equal(match.highRisk, true);
});

test('CASE 7: anaphylaxis routes to adrenaline + emergency escalation', () => {
  const match = routeSymptoms('severe allergy swollen tongue anaphylaxis');
  assert.equal(match.scenarioId, 'anaphylaxis');
  assert.deepEqual(getScenario('anaphylaxis').steps.slice(0, 2), ['anaphylaxis_adrenaline', 'step_call_999']);
});

test('CASE 8: seizure routes to protect/time/nothing-in-mouth flow', () => {
  const match = routeSymptoms('person is having a seizure');
  assert.equal(match.scenarioId, 'seizure');
  const steps = getScenario('seizure').steps;
  assert.ok(steps.includes('seizure_protect'));
  assert.ok(steps.includes('seizure_time'));
  assert.ok(steps.includes('seizure_nothing_mouth'));
});

test('CASE 9: high-risk free text cannot be downgraded by generic routing', () => {
  assert.equal(routeSymptoms('not breathing').type, 'CPR_SELECT');
  assert.equal(routeSymptoms('baby not breathing').type, 'CPR');
  assert.equal(routeSymptoms('baby not breathing').age, 'infant');
  assert.equal(routeSymptoms('nieprzytomny bez kontaktu').type, 'UNRESPONSIVE_CHECK_BREATHING');
  assert.equal(routeSymptoms('شدید خون بہہ رہا ہے').scenarioId, 'severe_bleeding');
});

test('CASE 10: service worker precaches every core module, language pack and icon', async () => {
  const sw = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');
  const languageFiles = await readdir(new URL('../src/lang/', import.meta.url));
  for (const file of ['index.html', 'styles.css', 'app.webmanifest', 'src/app.js', 'src/emergency-state.js', 'src/emergency-data.js', 'src/i18n.js', 'icons/icon-192.png', 'icons/icon-512.png']) {
    assert.match(sw, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const file of languageFiles.filter((file) => file.endsWith('.js'))) assert.match(sw, new RegExp(`src/lang/${file.replace('.', '\\.')}`));
  assert.match(sw, /caches\.open\(CACHE_NAME\)/);
  assert.match(sw, /caches\.match/);
});

test('CASE 11: changing language preserves current emergency state', () => {
  let state = beginEmergency(createState('en'));
  state = answerTriage(state, Answer.YES);
  const before = structuredClone(state);
  state = setLanguage(state, 'pl');
  assert.equal(state.language, 'pl');
  assert.equal(state.screen, before.screen);
  assert.equal(state.emergencyActive, true);
  assert.equal(state.triage.currentQuestion, before.triage.currentQuestion);
  assert.deepEqual(state.triage.answers, before.triage.answers);
});

test('CASE 12: narrow-phone CSS keeps large controls and responsive grids', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /body\{[^}]*overflow-x:hidden/);
  assert.match(css, /\.emergency-button\{[^}]*min-width:236px;min-height:236px/);
  assert.match(css, /\.answer-button\{[^}]*min-height:92px/);
  assert.match(css, /\.sticky-call\{[^}]*min-height:62px/);
  assert.match(css, /@media \(max-width:390px\)/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('CPR protocols are distinct for adult, child and infant', () => {
  const adult = getScenario('cpr_adult').steps;
  const child = getScenario('cpr_child').steps;
  const infant = getScenario('cpr_infant').steps;
  assert.ok(adult.includes('cpr_adult_rate_depth'));
  assert.ok(child.includes('cpr_child_five_breaths'));
  assert.ok(infant.includes('cpr_infant_five_breaths'));
  assert.ok(infant.includes('cpr_infant_compressions'));
  assert.ok(adult.includes('cpr_aed') && child.includes('cpr_aed') && infant.includes('cpr_aed'));
});

test('all required 17 UK-relevant languages are present with direct critical labels', () => {
  assert.equal(LANGUAGES.length, 17);
  const requiredCodes = ['en','pl','ro','ur','pa','bn','gu','ar','pt','es','fr','lt','bg','uk','zh','tr','it'];
  assert.deepEqual(LANGUAGES.map((item) => item.code), requiredCodes);
  const criticalKeys = ['emergency_button','call_999','call_112','yes','no','unknown','question_responsive_title','question_breathing_title','scenario_severe_bleeding','scenario_chest_pain','scenario_stroke','scenario_anaphylaxis','cpr_call_speaker'];
  for (const code of requiredCodes) {
    for (const key of criticalKeys) assert.equal(hasDirectTranslation(code, key), true, `${code} missing ${key}`);
  }
});

test('English medical database has text for every scenario title and every step', () => {
  const en = getPack('en');
  for (const [id, scenario] of Object.entries(scenarios)) {
    assert.equal(typeof en[scenario.titleKey], 'string', `${id} missing title ${scenario.titleKey}`);
    for (const step of scenario.steps) assert.equal(typeof en[step], 'string', `${id} missing step ${step}`);
    if (scenario.emergencyCriteriaKey) assert.equal(typeof en[scenario.emergencyCriteriaKey], 'string');
  }
});

test('PWA manifest is standalone and includes install icons', async () => {
  const manifest = JSON.parse(await readFile(new URL('../app.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.name, 'NOSMO Emergency Button');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'));
});

test('production UI contains no fake responder, team-alert or demo claims', async () => {
  const files = ['index.html','src/app.js','src/emergency-state.js','src/emergency-data.js'];
  const source = (await Promise.all(files.map((file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8')))).join('\n');
  for (const pattern of [/synthetic responder/i, /alerting demo/i, /join live audio/i, /no real alerts sent/i, /demo-first-aider/i]) assert.doesNotMatch(source, pattern);
});

test('symptom and location handling has no backend transport and no dependency on other NOSMO applications', async () => {
  const files = ['src/app.js','src/emergency-state.js','src/emergency-data.js','src/i18n.js'];
  const source = (await Promise.all(files.map((file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8')))).join('\n');
  for (const pattern of [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /EventSource/, /RTCPeerConnection/, /MediaRecorder/]) assert.doesNotMatch(source, pattern);
  assert.doesNotMatch(source, /NOSMO Work|NOSMO Agency|Nexus Core|nosmo-nexus-mvp/i);
  assert.doesNotMatch(source, /localStorage\.setItem\([^)]*(symptom|location)/i);
});

test('999 / 112 actions are truthful platform dialler actions, not claimed connected calls', async () => {
  const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const en = getPack('en');
  assert.match(app, /window\.location\.href = `tel:\$\{number\}`/);
  assert.match(en.opens_dialler, /cannot confirm/i);
  assert.doesNotMatch(app, /call connected|ambulance dispatched|services notified/i);
});
