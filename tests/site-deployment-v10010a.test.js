import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildSiteDeploymentUrl, decodeSiteDeployment, encodeSiteDeployment, parseSiteDeploymentHash, SITE_DEPLOYMENT_FRAGMENT_KEY } from '../src/site-deployment.js';

const card={siteName:'Project Atlas',address:'1 Example Street, Leeds',postcode:'LS1 2AB',ambulanceAccess:'Gate 3 north entrance',siteOffice:'0113 000 0000',firstAidRoom:'Ground floor welfare',aedLocation:'Reception wall',musterPoint:'North yard',emergencyProcedure:'Banksman meets ambulance at Gate 3'};

test('V1.0010A deployment payload round-trips only supported Site Card fields',()=>{
  const token=encodeSiteDeployment({...card,extra:'must not survive'});
  const decoded=decodeSiteDeployment(token);
  assert.equal(decoded.siteName,card.siteName);
  assert.equal(decoded.ambulanceAccess,card.ambulanceAccess);
  assert.equal('extra' in decoded,false);
});

test('deployment link carries site data in URL fragment and strips query parameters',()=>{
  const url=buildSiteDeploymentUrl(card,'https://nosmo-emergency-button.vercel.app/?utm_source=test');
  const parsed=new URL(url);
  assert.equal(parsed.search,'');
  assert.ok(parsed.hash.startsWith(`#${SITE_DEPLOYMENT_FRAGMENT_KEY}=`));
  assert.deepEqual(parseSiteDeploymentHash(parsed.hash),card);
});

test('deployment codec supports non-ASCII site text',()=>{
  const token=encodeSiteDeployment({...card,siteName:'Budowa Łódź 工地'});
  assert.equal(decodeSiteDeployment(token).siteName,'Budowa Łódź 工地');
});

test('invalid or unsupported deployment fragments fail closed',()=>{
  assert.equal(decodeSiteDeployment('not-valid-base64'),null);
  assert.equal(parseSiteDeploymentHash('#other=value'),null);
});

test('import requires explicit user action and does not silently overwrite Site Card',async()=>{
  const source=await readFile(new URL('../src/site-deployment.js',import.meta.url),'utf8');
  assert.match(source,/data-deploy-import/);
  assert.match(source,/addEventListener\('click',\(\)=>\{importSiteDeployment\(value\)/);
  assert.match(source,/Nothing is imported until you press IMPORT SITE CARD/);
  assert.match(source,/IMPORT WILL REPLACE THE SITE CARD CURRENTLY STORED ON THIS DEVICE/);
});

test('site deployment layer is local-only and has no backend transport',async()=>{
  const source=await readFile(new URL('../src/site-deployment.js',import.meta.url),'utf8');
  for(const pattern of [/\bfetch\s*\(/,/XMLHttpRequest/,/WebSocket/,/EventSource/,/sendBeacon/,/MediaRecorder/])assert.doesNotMatch(source,pattern);
  assert.match(source,/url\.hash=/);
  assert.match(source,/localStorage\.setItem\(SITE_CARD_STORAGE_KEY/);
});

test('production shell loads and offline-caches V1.0010A deployment files',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  const version=(await readFile(new URL('../VERSION',import.meta.url),'utf8')).trim();
  for(const token of ['site-deployment.css','src/site-deployment.js'])assert.match(html,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(sw,/v1-0010a/);
  assert.match(sw,/site-deployment\.css/);
  assert.match(sw,/src\/site-deployment\.js/);
  assert.equal(version,'V1.0010');
});
