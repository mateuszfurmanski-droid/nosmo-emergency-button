import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { LANGUAGES, hasDirectTranslation, translate } from '../src/i18n.js';
import { LANGUAGE_STORAGE_KEY, SITE_LANGUAGE } from '../src/multilingual-ui.js';

const codes=['en','pl','ro','ur','pa','bn','gu','ar','pt','es','fr','lt','bg','uk','zh','tr','it'];

test('V1.0007 exposes exactly 17 Emergency Core languages',()=>{
  assert.deepEqual(LANGUAGES.map((l)=>l.code),codes);
  assert.equal(new Set(LANGUAGES.map((l)=>l.code)).size,17);
});

test('all 17 language packs contain critical emergency controls',()=>{
  const critical=['yes','no','unknown','call_999','call_112','emergency_mode','question_scene_title','question_breathing_title'];
  for(const code of codes){
    for(const key of critical){
      assert.ok(hasDirectTranslation(code,key),`${code} missing ${key}`);
      const value=translate(code,key);
      assert.equal(typeof value,'string');
      assert.ok(value.length>0,`${code} empty ${key}`);
    }
  }
});

test('Site Card shell translations cover every supported language',()=>{
  const fields=['siteCard','project','address','postcode','ambulance','office','firstAid','aed','muster','procedure','save','handover','clear','close','setup','ready','handoverReady','edit','gps','copy','share','language','fallback','operator'];
  assert.deepEqual(Object.keys(SITE_LANGUAGE),codes);
  for(const code of codes){for(const field of fields)assert.ok(SITE_LANGUAGE[code][field],`${code} missing site field ${field}`);}
});

test('Urdu and Arabic are explicitly RTL without changing the whole language list',()=>{
  assert.equal(LANGUAGES.find((l)=>l.code==='ur').dir,'rtl');
  assert.equal(LANGUAGES.find((l)=>l.code==='ar').dir,'rtl');
  assert.equal(LANGUAGES.find((l)=>l.code==='pl').dir,'ltr');
});

test('multilingual layer stores only language preference and does not reset incident state',async()=>{
  const source=await readFile(new URL('../src/multilingual-ui.js',import.meta.url),'utf8');
  assert.equal(LANGUAGE_STORAGE_KEY,'nosmo-emergency-language-v1');
  assert.match(source,/localStorage\.setItem\(LANGUAGE_STORAGE_KEY/);
  assert.doesNotMatch(source,/location\.reload|resetEmergency|activateEmergency|incident\s*=/);
  for(const pattern of [/\bfetch\s*\(/,/XMLHttpRequest/,/WebSocket/,/EventSource/,/MediaRecorder/]) assert.doesNotMatch(source,pattern);
});

test('non-English detailed guidance has explicit English fallback warning',()=>{
  for(const code of codes.filter((c)=>c!=='en')){
    assert.match(SITE_LANGUAGE[code].fallback,/./);
  }
});

test('production HTML loads multilingual layer without replacing Emergency Core baseline',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  for(const token of ['styles.css','activate-button','emergency-shell','status-grid','siteCardHome','src/multilingual-ui.js','multilingual.css']) assert.match(html,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('V1.0007 service worker precaches multilingual runtime and all 17 packs',async()=>{
  const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(sw,/v1-0007/);
  for(const token of ['multilingual.css','src/multilingual-ui.js','src/i18n.js',...codes.map((c)=>`src/lang/${c}.js`)]) assert.match(sw,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
