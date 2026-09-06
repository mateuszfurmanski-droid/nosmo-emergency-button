import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { EMPTY_SITE_CARD, SITE_CARD_STORAGE_KEY, buildHandoverLines, buildHandoverText, isSiteCardConfigured, normalizeSiteCard } from '../src/site-emergency-card.js';

test('Site Card normalizes and trims only supported local fields',()=>{
  const card=normalizeSiteCard({siteName:'  Project Atlas ',postcode:' LS1 2AB ',extra:'ignore'});
  assert.equal(card.siteName,'Project Atlas');
  assert.equal(card.postcode,'LS1 2AB');
  assert.deepEqual(Object.keys(card),Object.keys(EMPTY_SITE_CARD));
  assert.equal('extra' in card,false);
});

test('Site Card configuration status uses site identity or ambulance access',()=>{
  assert.equal(isSiteCardConfigured({}),false);
  assert.equal(isSiteCardConfigured({postcode:'LS1 2AB'}),true);
  assert.equal(isSiteCardConfigured({ambulanceAccess:'Gate 3'}),true);
});

test('999 handover includes site access casualty triage and live GPS',()=>{
  const card={siteName:'Project Atlas',address:'1 Example Street, Leeds',postcode:'LS1 2AB',ambulanceAccess:'Gate 3 north entrance',siteOffice:'0113 000 0000',firstAidRoom:'Ground floor welfare',aedLocation:'Reception wall',musterPoint:'North yard',emergencyProcedure:'Banksman meets ambulance at Gate 3'};
  const incident={scenario:'severe_bleeding',answers:{responsive:'YES',breathing:'YES',severe_bleeding:'YES'},location:{status:'AVAILABLE',latitude:53.8008,longitude:-1.5491,accuracyMetres:8}};
  const text=buildHandoverText(card,incident);
  for(const value of ['Project Atlas','LS1 2AB','Gate 3 north entrance','LIFE-THREATENING BLEEDING','RESPONSIVE: YES','BREATHING: YES','SEVERE BLEEDING: YES','53.80080, -1.54910 ±8m'])assert.match(text,new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('handover never invents missing site or GPS data',()=>{
  const lines=buildHandoverLines({},null,null);
  const values=Object.fromEntries(lines.map(([label,value])=>[label,value]));
  assert.equal(values.SITE,'NOT SET');
  assert.equal(values.POSTCODE,'NOT SET');
  assert.equal(values['AMBULANCE ACCESS'],'NOT SET');
  assert.equal(values.GPS,'NOT AVAILABLE');
  assert.equal(values.CASUALTY,'EMERGENCY SESSION NOT STARTED');
});

test('production UI exposes Site Card before and during Emergency Mode without replacing core layout',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  for(const token of ['styles.css','engine.css','site-card.css','id="siteCardHome"','id="siteCardStatus"','src/site-emergency-card.js','activate-button','emergency-shell','status-grid'])assert.match(html,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.ok(html.indexOf('styles.css')<html.indexOf('site-card.css'));
});

test('Site Card stores only the site profile locally and has no backend transport',async()=>{
  const source=await readFile(new URL('../src/site-emergency-card.js',import.meta.url),'utf8');
  assert.match(source,new RegExp(SITE_CARD_STORAGE_KEY));
  assert.match(source,/localStorage\.setItem/);
  for(const pattern of [/\bfetch\s*\(/,/XMLHttpRequest/,/WebSocket/,/EventSource/,/MediaRecorder/,/RTCPeerConnection/])assert.doesNotMatch(source,pattern);
});

test('999 and 112 handover calls remain explicit device dialler actions',async()=>{
  const source=await readFile(new URL('../src/site-emergency-card.js',import.meta.url),'utf8');
  assert.match(source,/data-handover-call="999"/);
  assert.match(source,/data-handover-call="112"/);
  assert.match(source,/window\.location\.href=`tel:\$\{number\}`/);
  assert.doesNotMatch(source,/call connected|ambulance dispatched|services notified|responder alerted/i);
});

test('Site Card UI and logic remain precached in later releases',async()=>{
  const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(sw,/nosmo-emergency-core-v1-/);
  for(const file of ['site-card.css','src/site-emergency-card.js'])assert.match(sw,new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
