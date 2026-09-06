import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { LANGUAGES, hasDirectTranslation, translate } from '../src/i18n.js';
import { LANGUAGE_STORAGE_KEY, SITE_LANGUAGE } from '../src/multilingual-runtime.js';

const codes=['en','pl','ro','ur','pa','bn','gu','ar','pt','es','fr','lt','bg','uk','zh','tr','it'];

test('V1.0007 exposes exactly 17 Emergency Core languages',()=>{
  assert.deepEqual(LANGUAGES.map((l)=>l.code),codes);
  assert.equal(new Set(LANGUAGES.map((l)=>l.code)).size,17);
});

test('all 17 language packs contain critical emergency controls',()=>{
  const critical=['yes','no','unknown','call_999','call_112','emergency_mode','question_scene_title','question_breathing_title'];
  for(const code of codes){for(const key of critical){assert.ok(hasDirectTranslation(code,key),`${code} missing ${key}`);assert.ok(translate(code,key).length>0);}}
});

test('Site Card shell translations cover every supported language',()=>{
  const fields=['siteCard','project','address','postcode','ambulance','office','firstAid','aed','muster','procedure','save','handover','clear','close','setup','ready','handoverReady','edit','gps','copy','share','language','fallback','operator'];
  assert.deepEqual(Object.keys(SITE_LANGUAGE),codes);
  for(const code of codes){for(const field of fields)assert.ok(SITE_LANGUAGE[code][field],`${code} missing site field ${field}`);}
});

test('Urdu and Arabic are explicitly RTL without flipping the full core layout',async()=>{
  assert.equal(LANGUAGES.find((l)=>l.code==='ur').dir,'rtl');
  assert.equal(LANGUAGES.find((l)=>l.code==='ar').dir,'rtl');
  assert.equal(LANGUAGES.find((l)=>l.code==='pl').dir,'ltr');
  const css=await readFile(new URL('../multilingual.css',import.meta.url),'utf8');
  assert.match(css,/rtl-language \.guidance-copy/);
  assert.doesNotMatch(css,/rtl-language \.start-screen|rtl-language \.emergency-shell/);
});

test('multilingual runtime preserves canonical text keys across repeated language switches',async()=>{
  const source=await readFile(new URL('../src/multilingual-runtime.js',import.meta.url),'utf8');
  assert.equal(LANGUAGE_STORAGE_KEY,'nosmo-emergency-language-v1');
  assert.match(source,/const nodeDescriptors=new WeakMap\(\)/);
  assert.match(source,/nodeDescriptors\.has\(node\)/);
  assert.match(source,/localStorage\.setItem\(LANGUAGE_STORAGE_KEY/);
  assert.doesNotMatch(source,/location\.reload|resetEmergency|activateEmergency|incident\s*=/);
});

test('language buttons update text without innerHTML observer loop',async()=>{
  const source=await readFile(new URL('../src/multilingual-runtime.js',import.meta.url),'utf8');
  const start=source.indexOf('function updateLanguageButtons');
  const end=source.indexOf('export function getCurrentLanguageCode',start);
  const fn=source.slice(start,end);
  assert.match(fn,/\.textContent/);
  assert.doesNotMatch(fn,/innerHTML/);
  assert.match(source,/observer\.observe\(document\.body,\{childList:true,subtree:true\}\)/);
});

test('language controls share existing three-column headers instead of creating a fourth grid child',async()=>{
  const source=await readFile(new URL('../src/multilingual-runtime.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../multilingual.css',import.meta.url),'utf8');
  assert.match(source,/header-tools/);
  assert.match(source,/emergency-header-tools/);
  assert.match(css,/\.header-tools,\.emergency-header-tools\{display:flex/);
});

test('non-English detailed guidance has explicit English fallback warning',()=>{
  for(const code of codes.filter((c)=>c!=='en'))assert.match(SITE_LANGUAGE[code].fallback,/./);
});

test('production HTML loads stable multilingual runtime without replacing Emergency Core baseline',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  for(const token of ['styles.css','activate-button','emergency-shell','status-grid','siteCardHome','src/multilingual-runtime.js','multilingual.css'])assert.match(html,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.doesNotMatch(html,/src\/multilingual-ui\.js/);
});

test('stable multilingual runtime and all 17 packs remain precached in later releases',async()=>{
  const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(sw,/nosmo-emergency-core-v1-/);
  for(const token of ['multilingual.css','src/multilingual-runtime.js','src/site-language.js','src/i18n.js',...codes.map((c)=>`src/lang/${c}.js`)])assert.match(sw,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
