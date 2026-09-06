import { EMPTY_SITE_CARD, SITE_CARD_STORAGE_KEY, normalizeSiteCard, isSiteCardConfigured } from './site-emergency-card.js';

export const SITE_DEPLOYMENT_FRAGMENT_KEY='nosmo-site';
export const SITE_DEPLOYMENT_SCHEMA=1;
export const SITE_DEPLOYMENT_MAX_TOKEN=12000;

function bytesToBase64(bytes){
  let binary='';
  for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(binary);
}
function base64ToBytes(value){
  const binary=atob(value);const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}
function toBase64Url(text){return bytesToBase64(new TextEncoder().encode(text)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
function fromBase64Url(value){
  const normalized=value.replaceAll('-','+').replaceAll('_','/');
  const padded=normalized+'='.repeat((4-normalized.length%4)%4);
  return new TextDecoder().decode(base64ToBytes(padded));
}

export function encodeSiteDeployment(card){
  const payload={v:SITE_DEPLOYMENT_SCHEMA,card:normalizeSiteCard(card)};
  const token=toBase64Url(JSON.stringify(payload));
  if(token.length>SITE_DEPLOYMENT_MAX_TOKEN)throw new Error('SITE_DEPLOYMENT_TOO_LARGE');
  return token;
}

export function decodeSiteDeployment(token){
  try{
    if(!token||token.length>SITE_DEPLOYMENT_MAX_TOKEN)return null;
    const payload=JSON.parse(fromBase64Url(token));
    if(payload?.v!==SITE_DEPLOYMENT_SCHEMA||!payload.card||typeof payload.card!=='object')return null;
    return normalizeSiteCard(payload.card);
  }catch{return null;}
}

export function buildSiteDeploymentUrl(card,baseHref=globalThis.location?.href||'https://nosmo-emergency-button.vercel.app/'){
  const url=new URL(baseHref);
  url.search='';
  url.hash=`${SITE_DEPLOYMENT_FRAGMENT_KEY}=${encodeSiteDeployment(card)}`;
  return url.toString();
}

export function parseSiteDeploymentHash(hash=globalThis.location?.hash||''){
  const value=String(hash||'').replace(/^#/,'');
  const params=new URLSearchParams(value);
  return decodeSiteDeployment(params.get(SITE_DEPLOYMENT_FRAGMENT_KEY));
}

function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function currentCard(){
  try{return normalizeSiteCard(JSON.parse(localStorage.getItem(SITE_CARD_STORAGE_KEY)||'{}'));}catch{return normalizeSiteCard();}
}
function updateVisibleStatus(card){
  if(typeof document==='undefined')return;
  const value=document.querySelector('#siteCardStatusValue');const detail=document.querySelector('#siteCardStatusDetail');
  if(value)value.textContent=isSiteCardConfigured(card)?(card.postcode||card.siteName||'READY').slice(0,28):'SET UP';
  if(detail)detail.textContent=isSiteCardConfigured(card)?'999 HANDOVER READY':'999 HANDOVER';
}
export function importSiteDeployment(card){
  const value=normalizeSiteCard(card);
  try{localStorage.setItem(SITE_CARD_STORAGE_KEY,JSON.stringify(value));}catch{}
  updateVisibleStatus(value);
  try{globalThis.dispatchEvent?.(new CustomEvent('nosmo-site-card-imported',{detail:{card:value}}));}catch{}
  return value;
}

let dialog=null;
function ensureDialog(){
  if(dialog||typeof document==='undefined')return dialog;
  dialog=document.createElement('dialog');dialog.id='siteDeploymentDialog';dialog.className='site-deployment-dialog';dialog.setAttribute('aria-label','Site Deployment Setup');document.body.appendChild(dialog);return dialog;
}
function openDialog(){const d=ensureDialog();if(typeof d.showModal==='function'&&!d.open)d.showModal();else d.setAttribute('open','');}
function closeDialog(){if(!dialog)return;if(typeof dialog.close==='function'&&dialog.open)dialog.close();else dialog.removeAttribute('open');}
function readEditorCard(){
  const form=document.querySelector('#siteCardForm');
  return form?normalizeSiteCard(Object.fromEntries(new FormData(form).entries())):currentCard();
}
async function copyText(text){try{await navigator.clipboard.writeText(text);globalThis.NOSMOField?.notice?.('SITE DEPLOYMENT LINK COPIED');return true;}catch{return false;}}
async function shareLink(url){
  try{if(navigator.share){await navigator.share({title:'NOSMO Site Emergency Card',text:'NOSMO site emergency setup link',url});return true;}}catch{return false;}
  return copyText(url);
}

function renderDeploymentSetup(card=readEditorCard()){
  const value=normalizeSiteCard(card);const d=ensureDialog();let url='';let error='';
  try{url=buildSiteDeploymentUrl(value);}catch{error='SITE CARD IS TOO LARGE TO CREATE A DEPLOYMENT LINK.';}
  d.innerHTML=`<div class="dialog-banner">SITE DEPLOYMENT • LOCAL LINK</div><div class="site-deployment-body"><div class="site-deployment-head"><p class="eyebrow">SET UP ANOTHER DEVICE</p><h2>DEPLOY SITE</h2><p>Create one link carrying this Site Card. Site data is stored in the URL fragment and is not sent to NOSMO or a backend.</p></div><div class="site-deployment-warning"><strong>PRIVACY:</strong> anyone who receives this link can read the site details contained in it.</div><div class="site-deployment-summary"></div>${error?`<div class="site-deployment-error">${error}</div>`:`<label class="site-deployment-link-label" for="siteDeploymentLink">DEPLOYMENT LINK</label><textarea id="siteDeploymentLink" class="site-deployment-link" readonly></textarea>`}<div class="site-deployment-actions">${url?'<button type="button" data-deploy-copy>COPY LINK</button><button type="button" data-deploy-share>SHARE LINK</button>':''}<button type="button" data-deploy-close>CLOSE</button></div></div>`;
  const summary=d.querySelector('.site-deployment-summary');
  for(const key of Object.keys(EMPTY_SITE_CARD)){const row=document.createElement('div');row.className='site-deployment-row';const label=document.createElement('span');label.textContent=key.replace(/([A-Z])/g,' $1').replace(/^./,(c)=>c.toUpperCase());const strong=document.createElement('strong');strong.textContent=value[key]||'NOT SET';row.append(label,strong);summary.appendChild(row);}
  const link=d.querySelector('#siteDeploymentLink');if(link)link.value=url;
  d.querySelector('[data-deploy-copy]')?.addEventListener('click',()=>copyText(url));
  d.querySelector('[data-deploy-share]')?.addEventListener('click',()=>shareLink(url));
  d.querySelector('[data-deploy-close]')?.addEventListener('click',closeDialog);
  openDialog();
}

function clearDeploymentHash(){
  if(typeof history==='undefined'||typeof location==='undefined')return;
  const url=new URL(location.href);url.hash='';history.replaceState(history.state,'',url.pathname+url.search);
}
function renderImportPrompt(card){
  const value=normalizeSiteCard(card);const existing=currentCard();const d=ensureDialog();
  d.innerHTML=`<div class="dialog-banner">SITE DEPLOYMENT LINK • LOCAL IMPORT</div><div class="site-deployment-body"><div class="site-deployment-head"><p class="eyebrow">SITE CARD FOUND IN LINK</p><h2>IMPORT SITE CARD?</h2><p>Review the details before saving them on this device. Nothing is imported until you press IMPORT SITE CARD.</p></div><div class="site-deployment-warning"><strong>LOCAL ONLY:</strong> the URL fragment is read on this device and is not submitted to NOSMO. ${isSiteCardConfigured(existing)?'IMPORT WILL REPLACE THE SITE CARD CURRENTLY STORED ON THIS DEVICE.':''}</div><div class="site-deployment-summary"></div><div class="site-deployment-actions"><button class="primary" type="button" data-deploy-import>IMPORT SITE CARD</button><button type="button" data-deploy-cancel>CANCEL</button></div></div>`;
  const summary=d.querySelector('.site-deployment-summary');
  for(const key of Object.keys(EMPTY_SITE_CARD)){const row=document.createElement('div');row.className='site-deployment-row';row.innerHTML=`<span>${escapeHtml(key.replace(/([A-Z])/g,' $1').replace(/^./,(c)=>c.toUpperCase()))}</span>`;const strong=document.createElement('strong');strong.textContent=value[key]||'NOT SET';row.appendChild(strong);summary.appendChild(row);}
  d.querySelector('[data-deploy-import]')?.addEventListener('click',()=>{importSiteDeployment(value);clearDeploymentHash();closeDialog();globalThis.NOSMOField?.notice?.('SITE CARD IMPORTED TO THIS DEVICE',3600);});
  d.querySelector('[data-deploy-cancel]')?.addEventListener('click',()=>{clearDeploymentHash();closeDialog();});
  openDialog();
}

function injectDeployAction(){
  if(typeof document==='undefined')return;
  const actions=document.querySelector('#siteEmergencyCardDialog .site-card-actions');if(!actions||actions.querySelector('[data-site-deploy]'))return;
  const button=document.createElement('button');button.type='button';button.className='site-card-action site-deploy-action';button.dataset.siteDeploy='';button.textContent='DEPLOY SITE';button.addEventListener('click',()=>renderDeploymentSetup(readEditorCard()));
  actions.insertBefore(button,actions.querySelector('[data-site-close]')||null);
}
function init(){
  if(typeof document==='undefined')return;
  injectDeployAction();
  const observer=new MutationObserver(injectDeployAction);observer.observe(document.body,{childList:true,subtree:true});
  const imported=parseSiteDeploymentHash();if(imported)queueMicrotask(()=>renderImportPrompt(imported));
}
init();

globalThis.NOSMOSiteDeployment=Object.freeze({buildUrl:buildSiteDeploymentUrl,parseHash:parseSiteDeploymentHash,open:renderDeploymentSetup,importCard:importSiteDeployment});
