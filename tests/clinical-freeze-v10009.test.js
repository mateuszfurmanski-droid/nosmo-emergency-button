import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { LANGUAGES } from '../src/i18n.js';
import { scenarioSources, sources } from '../src/source-provenance.js';
import {
  CLINICAL_FREEZE_REVISION,
  LIVE_RUNTIME_SCENARIOS,
  MEDICAL_COPY_BLOBS,
  RELEASE_GATES,
  RELEASE_STATUS,
  TRANSLATION_PACK_BLOBS,
  TRANSLATION_REVIEW_STATUS,
  getMissingSourceCoverage,
  isPilotReleaseAllowed,
} from '../src/clinical-freeze.js';

function gitBlobSha(content){
  const body=Buffer.from(content,'utf8');
  return createHash('sha1').update(Buffer.from(`blob ${body.length}\0`)).update(body).digest('hex');
}

test('V1.0009 clinical freeze is an engineering RC with release gates closed',()=>{
  assert.equal(CLINICAL_FREEZE_REVISION,'CF-2026-09-06-01');
  assert.equal(RELEASE_STATUS,'ENGINEERING_RC');
  assert.equal(isPilotReleaseAllowed(),false);
  for(const gate of Object.values(RELEASE_GATES)){
    assert.equal(gate.requiredForPilot,true);
    assert.equal(gate.status,'PENDING');
  }
});

test('every live Emergency Core and Site Medical scenario has source provenance',()=>{
  assert.deepEqual(getMissingSourceCoverage(),[]);
  assert.equal(new Set(LIVE_RUNTIME_SCENARIOS).size,LIVE_RUNTIME_SCENARIOS.length);
  for(const scenario of LIVE_RUNTIME_SCENARIOS){
    const ids=scenarioSources[scenario];
    assert.ok(Array.isArray(ids)&&ids.length>0,`${scenario} missing provenance`);
    for(const id of ids){
      assert.ok(sources[id],`${scenario} references missing source ${id}`);
      assert.match(sources[id].url,/^https:\/\//,`${id} must use https`);
      assert.ok(sources[id].authority,`${id} missing authority`);
    }
  }
});

test('frozen English medical copy matches the pinned Git blob fingerprints',async()=>{
  for(const [path,expected] of Object.entries(MEDICAL_COPY_BLOBS)){
    const content=await readFile(new URL(`../${path}`,import.meta.url),'utf8');
    assert.equal(gitBlobSha(content),expected,`${path} changed without a new clinical freeze revision`);
  }
});

test('all 17 language packs are pinned and non-English packs remain human-review-required',async()=>{
  const codes=LANGUAGES.map((language)=>language.code).sort();
  assert.deepEqual(Object.keys(TRANSLATION_PACK_BLOBS).sort(),codes);
  for(const code of codes){
    const content=await readFile(new URL(`../src/lang/${code}.js`,import.meta.url),'utf8');
    assert.equal(gitBlobSha(content),TRANSLATION_PACK_BLOBS[code],`${code} pack changed without a new clinical freeze revision`);
    assert.equal(TRANSLATION_REVIEW_STATUS[code],code==='en'?'SOURCE_LANGUAGE':'HUMAN_REVIEW_REQUIRED');
  }
});

test('production-facing files make no certified or pilot-ready claim',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const manifest=await readFile(new URL('../app.webmanifest',import.meta.url),'utf8');
  const visible=`${html}\n${manifest}`;
  assert.doesNotMatch(visible,/clinically approved|medical device certified|\bcertified\b|\bpilot[- ]ready\b|\bproduction[- ]ready\b/i);
});

test('V1.0009 version and offline cache include clinical freeze metadata',async()=>{
  const version=await readFile(new URL('../VERSION',import.meta.url),'utf8');
  const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.equal(version.trim(),'V1.0009');
  assert.match(sw,/v1-0009/);
  assert.match(sw,/src\/source-provenance\.js/);
  assert.match(sw,/src\/clinical-freeze\.js/);
});
