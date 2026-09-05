import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { SITE_MEDICAL_SCENARIOS } from '../src/site-medical-ui.js';

const ids = ['open_chest_wound','fracture_dislocation','eye_injury','fume_inhalation','heat_illness','hypothermia','seizure','hypoglycaemia'];

test('V1.0005 exposes all eight site medical scenarios',()=>{
  assert.deepEqual(Object.keys(SITE_MEDICAL_SCENARIOS),ids);
  for(const id of ids){
    const s=SITE_MEDICAL_SCENARIOS[id];
    assert.equal(typeof s.label,'string');
    assert.ok(s.steps.length>=4,`${id} has too few steps`);
  }
});

test('open chest wound guidance follows 2025 RCUK non-occlusive approach',()=>{
  const text=SITE_MEDICAL_SCENARIOS.open_chest_wound.steps.join(' ');
  assert.match(text,/Call 999/i);
  assert.match(text,/Leave the open chest wound exposed/i);
  assert.match(text,/Do not cover/i);
  assert.match(text,/non-occlusive|vented/i);
});

test('fracture and dislocation guidance prevents harmful manipulation',()=>{
  const text=SITE_MEDICAL_SCENARIOS.fracture_dislocation.steps.join(' ');
  assert.match(text,/Do not try to straighten/i);
  assert.match(text,/put a dislocated joint back/i);
  assert.match(text,/open fracture/i);
  assert.match(text,/back\/neck\/pelvis/i);
});

test('eye injury guidance covers chemical, penetrating and high-speed injuries',()=>{
  const text=SITE_MEDICAL_SCENARIOS.eye_injury.steps.join(' ');
  assert.match(text,/chemical/i);
  assert.match(text,/penetrating/i);
  assert.match(text,/high-speed/i);
  assert.match(text,/at least 20 minutes/i);
  assert.match(text,/Do not rub/i);
});

test('fume inhalation guidance prioritises rescuer safety and fresh air',()=>{
  const text=SITE_MEDICAL_SCENARIOS.fume_inhalation.steps.join(' ');
  assert.match(text,/Do not enter a contaminated or confined area/i);
  assert.match(text,/fresh air/i);
  assert.match(text,/Call 999/i);
  assert.match(text,/start CPR/i);
});

test('heat illness guidance contains current NHS 30-minute escalation',()=>{
  const text=SITE_MEDICAL_SCENARIOS.heat_illness.steps.join(' ');
  assert.match(text,/cool place/i);
  assert.match(text,/30 minutes/i);
  assert.match(text,/confusion/i);
  assert.match(text,/Call 999/i);
});

test('hypothermia guidance avoids unsafe rapid heating',()=>{
  const text=SITE_MEDICAL_SCENARIOS.hypothermia.steps.join(' ');
  assert.match(text,/Call 999/i);
  assert.match(text,/remove wet clothing/i);
  assert.match(text,/Do not use a hot bath/i);
  assert.match(text,/do not give alcohol/i);
});

test('seizure guidance protects, times and escalates at five minutes',()=>{
  const text=SITE_MEDICAL_SCENARIOS.seizure.steps.join(' ');
  assert.match(text,/protect their head/i);
  assert.match(text,/do not put anything in their mouth/i);
  assert.match(text,/more than 5 minutes/i);
  assert.match(text,/recovery position/i);
});

test('hypoglycaemia guidance uses oral glucose only when swallowing is safe',()=>{
  const text=SITE_MEDICAL_SCENARIOS.hypoglycaemia.steps.join(' ');
  assert.match(text,/15–20 g/i);
  assert.match(text,/awake and can swallow safely/i);
  assert.match(text,/give nothing by mouth/i);
  assert.match(text,/Call 999/i);
});

test('V1.0005 module is loaded and cached offline',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(html,/site-medical\.css/);
  assert.match(html,/src\/site-medical-ui\.js/);
  assert.match(sw,/site-medical\.css/);
  assert.match(sw,/src\/site-medical-ui\.js/);
  assert.match(sw,/v1-0005/);
});

test('site medical module has no backend transport or fake responder state',async()=>{
  const source=await readFile(new URL('../src/site-medical-ui.js',import.meta.url),'utf8');
  for(const pattern of [/\bfetch\s*\(/,/XMLHttpRequest/,/WebSocket/,/EventSource/,/MediaRecorder/,/responder/i,/dispatched/i,/call connected/i]) assert.doesNotMatch(source,pattern);
  assert.match(source,/window\.location\.href = `tel:\$\{number\}`/);
});
