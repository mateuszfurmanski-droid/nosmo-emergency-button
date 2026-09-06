import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { FIELD_RELOAD_GUARD, isStandaloneMode } from '../src/field-runtime.js';

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('V1.0008 manifest is installable production PWA metadata',async()=>{
  const manifest=JSON.parse(await read('app.webmanifest'));
  assert.equal(manifest.name,'NOSMO Emergency Core');
  assert.equal(manifest.short_name,'NOSMO SOS');
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'./');
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.id,'./');
  assert.equal(manifest.orientation,'any');
  assert.equal(manifest.icons.length,2);
  assert.deepEqual(manifest.icons.map((i)=>i.sizes),['192x192','512x512']);
  assert.doesNotMatch(manifest.name,/demo/i);
});

test('production HTML loads install metadata and field runtime without replacing Emergency Core baseline',async()=>{
  const html=await read('index.html');
  for(const token of ['styles.css','activate-button','emergency-shell','viewport-fit=cover','mobile-web-app-capable','apple-mobile-web-app-capable','apple-touch-icon','field.css','src/field-runtime.js']) assert.match(html,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.ok(html.indexOf('styles.css')<html.indexOf('field.css'));
});

test('field runtime exposes install only after browser install event and prompts only from click handler',async()=>{
  const source=await read('src/field-runtime.js');
  assert.match(source,/beforeinstallprompt/);
  assert.match(source,/event\.preventDefault\(\)/);
  assert.match(source,/fieldInstallButton/);
  assert.match(source,/addEventListener\('click'/);
  const promptCall=source.indexOf('await prompt.prompt()');
  const clickHandler=source.indexOf("button.addEventListener('click'");
  assert.ok(promptCall>clickHandler,'install prompt must be user-triggered');
});

test('field update handling never reloads during active emergency',async()=>{
  const source=await read('src/field-runtime.js');
  const activeCheck=source.indexOf('const activeIncident=Boolean(getEmergencySnapshot())');
  const activeGuard=source.indexOf('if(activeIncident)');
  const reload=source.indexOf('window.location.reload()');
  assert.ok(activeCheck>=0&&activeGuard>activeCheck&&reload>activeGuard);
  assert.match(source,/UPDATE READY • APPLIES AFTER EMERGENCY/);
  assert.equal(FIELD_RELOAD_GUARD,'nosmo-field-reload-v1');
});

test('field runtime and install assets remain precached in later releases',async()=>{
  const sw=await read('service-worker.js');
  assert.match(sw,/nosmo-emergency-core-v1-/);
  for(const token of ['./VERSION','field.css','src/field-runtime.js','app.webmanifest','icons/icon-192.png','icons/icon-512.png']) assert.match(sw,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(sw,/caches\.match\('\.\/index\.html'\)/);
});

test('field layer preserves large emergency controls and supports rotation',async()=>{
  const core=await read('styles.css');
  const field=await read('field.css');
  assert.match(core,/\.activate-button[\s\S]*min-height:\s*52dvh/);
  assert.match(core,/@media \(max-width: 560px\)[\s\S]*\.activate-button[\s\S]*min-height:\s*58dvh/);
  assert.match(core,/@media \(orientation: landscape\) and \(max-height: 600px\)/);
  assert.match(field,/@media\(pointer:coarse\)/);
  assert.match(field,/touch-action:manipulation/);
});

test('field runtime has no backend transport, microphone capture or automatic emergency call',async()=>{
  const source=await read('src/field-runtime.js');
  for(const pattern of [/\bfetch\s*\(/,/XMLHttpRequest/,/WebSocket/,/EventSource/,/MediaRecorder/,/getUserMedia/,/tel:999/,/tel:112/]) assert.doesNotMatch(source,pattern);
});

test('node environment is not falsely reported as installed standalone mode',()=>{
  assert.equal(isStandaloneMode(),false);
});
