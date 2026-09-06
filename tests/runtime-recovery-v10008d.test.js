import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { RUNTIME_RECOVERY_EVENTS, locationCanRetry } from '../src/runtime-recovery.js';

test('V1.0008D listens for Android return and visibility recovery events',()=>{
  assert.deepEqual(RUNTIME_RECOVERY_EVENTS,['pageshow','focus','visibilitychange']);
});

test('GPS remains explicitly retryable after denied or unavailable states',()=>{
  for(const status of ['IDLE','DENIED','UNAVAILABLE','AVAILABLE'])assert.equal(locationCanRetry({location:{status}}),true,status);
  assert.equal(locationCanRetry({location:{status:'REQUESTING'}}),false);
});

test('runtime recovery reacquires wake lock after a released sentinel',async()=>{
  const source=await readFile(new URL('../src/runtime-recovery.js',import.meta.url),'utf8');
  assert.match(source,/wakeLock\.request\('screen'\)/);
  assert.match(source,/recoveryWakeLock&&!recoveryWakeLock\.released/);
  assert.match(source,/addEventListener\?\.\('release'/);
  assert.match(source,/recoveryWakeLock=null/);
});

test('fullscreen recovery is attempted and falls back to the next user tap',async()=>{
  const source=await readFile(new URL('../src/runtime-recovery.js',import.meta.url),'utf8');
  assert.match(source,/requestFullscreen\(\{navigationUI:'hide'\}\)/);
  assert.match(source,/addEventListener\('pointerdown',handleFullscreenGesture,\{once:true,capture:true\}\)/);
  assert.match(source,/TAP SCREEN TO RESTORE FULLSCREEN/);
  assert.doesNotMatch(source,/location\.reload|history\.go|window\.close/);
});

test('return from dialler keeps the existing emergency incident instead of resetting it',async()=>{
  const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
  const line=app.split('\n').find((value)=>value.includes('function openDialler'))||'';
  assert.match(line,/CALL_DIALER_OPENED/);
  assert.match(line,/window\.location\.href=`tel:\$\{number\}`/);
  assert.doesNotMatch(line,/resetEmergency|incident=null|location\.reload/);
});

test('existing location status card supports tap-to-retry after failure',async()=>{
  const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(app,/GPS DENIED/);
  assert.match(app,/GPS UNAVAILABLE/);
  assert.match(app,/TAP TO RETRY/);
  assert.match(app,/refs\.locationStatus\.addEventListener\('click',requestLocation\)/);
});

test('runtime recovery remains loaded and cached offline in later releases',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(html,/src\/runtime-recovery\.js/);
  assert.match(sw,/src\/runtime-recovery\.js/);
  assert.match(sw,/nosmo-emergency-core-v1-/);
});

test('runtime recovery adds no backend, responder or dispatch behaviour',async()=>{
  const source=await readFile(new URL('../src/runtime-recovery.js',import.meta.url),'utf8');
  for(const pattern of [/\bfetch\s*\(/,/XMLHttpRequest/,/WebSocket/,/EventSource/,/MediaRecorder/,/responder/i,/ambulance dispatched/i,/call connected/i])assert.doesNotMatch(source,pattern);
});
