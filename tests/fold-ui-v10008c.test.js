import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('V1.0008C keeps original Emergency Core CSS as baseline and loads field layer after it',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/styles\.css/);
  assert.match(html,/field\.css/);
  assert.ok(html.indexOf('styles.css')<html.indexOf('field.css'));
});

test('Fold cover and narrow phone rules protect horizontal overflow without hiding critical controls',async()=>{
  const css=await readFile(new URL('../field.css',import.meta.url),'utf8');
  assert.match(css,/overflow-x:hidden/);
  assert.match(css,/@media\(max-width:390px\)/);
  assert.match(css,/@media\(max-width:330px\)/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) auto auto/);
  for(const forbidden of [/\.activate-button\s*\{[^}]*display\s*:\s*none/is,/\.status-card\s*\{[^}]*display\s*:\s*none/is,/\.cancel-button\s*\{[^}]*display\s*:\s*none/is]) assert.doesNotMatch(css,forbidden);
});

test('safe-area handling covers left right and bottom insets',async()=>{
  const css=await readFile(new URL('../field.css',import.meta.url),'utf8');
  assert.match(css,/safe-area-inset-left/);
  assert.match(css,/safe-area-inset-right/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/\.start-header/);
  assert.match(css,/\.emergency-header/);
  assert.match(css,/\.cancel-button/);
});

test('coarse pointer targets remain at least 44px for compact controls',async()=>{
  const css=await readFile(new URL('../field.css',import.meta.url),'utf8');
  assert.match(css,/@media\(pointer:coarse\)/);
  assert.match(css,/min-height:44px/);
  for(const token of ['field-install-chip','language-chip','site-card-chip','voice-toggle','status-card','dialog-close']) assert.match(css,new RegExp(token));
});

test('low landscape viewport has dedicated hardening and dialogs stay within dynamic viewport',async()=>{
  const css=await readFile(new URL('../field.css',import.meta.url),'utf8');
  assert.match(css,/@media\(orientation:landscape\) and \(max-height:500px\)/);
  assert.match(css,/100dvh/);
  assert.match(css,/\.language-dialog/);
  assert.match(css,/\.call-dialog/);
});

test('Fold field.css remains cached in later releases',async()=>{
  const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(sw,/nosmo-emergency-core-v1-/);
  assert.match(sw,/field\.css/);
});
