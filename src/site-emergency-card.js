export const SITE_CARD_STORAGE_KEY='nosmo-site-emergency-card-v1';

export const EMPTY_SITE_CARD=Object.freeze({
  siteName:'',
  address:'',
  postcode:'',
  ambulanceAccess:'',
  siteOffice:'',
  firstAidRoom:'',
  aedLocation:'',
  musterPoint:'',
  emergencyProcedure:'',
});

const SCENARIO_LABELS=Object.freeze({
  scene_unsafe:'UNSAFE SCENE / HAZARD',
  unconscious_breathing:'UNRESPONSIVE — BREATHING',
  cpr:'NOT BREATHING NORMALLY — CPR',
  severe_bleeding:'LIFE-THREATENING BLEEDING',
  choking:'CHOKING',
  stroke:'POSSIBLE STROKE',
  anaphylaxis:'ANAPHYLAXIS',
  fall_head_spine:'FALL / HEAD / SPINE TRAUMA',
  crush_injury:'CRUSH / ENTRAPMENT',
  electrical_injury:'ELECTRICAL INJURY',
  thermal_burn:'SERIOUS BURN',
  chemical_burn:'CHEMICAL BURN',
  amputation:'AMPUTATION',
  operator:'UNSURE — OPERATOR GUIDANCE',
});

export function normalizeSiteCard(value={}){
  const result={};
  for(const key of Object.keys(EMPTY_SITE_CARD)) result[key]=String(value?.[key]??'').trim();
  return result;
}

export function isSiteCardConfigured(card){
  const value=normalizeSiteCard(card);
  return Boolean(value.siteName||value.address||value.postcode||value.ambulanceAccess);
}

function answerText(value){return value||'NOT ASKED';}

export function buildHandoverLines(card,snapshot=null,liveLocation=null){
  const site=normalizeSiteCard(card);
  const answers=snapshot?.answers||{};
  const location=liveLocation||snapshot?.location||null;
  const gps=location?.status==='AVAILABLE'&&Number.isFinite(Number(location.latitude))&&Number.isFinite(Number(location.longitude))
    ? `${Number(location.latitude).toFixed(5)}, ${Number(location.longitude).toFixed(5)}${Number.isFinite(Number(location.accuracyMetres))?` ±${Math.round(Number(location.accuracyMetres))}m`:''}`
    : 'NOT AVAILABLE';
  const casualty=snapshot?.scenario?SCENARIO_LABELS[snapshot.scenario]||String(snapshot.scenario).replaceAll('_',' ').toUpperCase():snapshot?'ASSESSMENT IN PROGRESS':'EMERGENCY SESSION NOT STARTED';
  return [
    ['SITE',site.siteName||'NOT SET','site'],
    ['ADDRESS',site.address||'NOT SET','site'],
    ['POSTCODE',site.postcode||'NOT SET','site'],
    ['AMBULANCE ACCESS',site.ambulanceAccess||'NOT SET','critical'],
    ['SITE OFFICE',site.siteOffice||'NOT SET',''],
    ['FIRST AID ROOM',site.firstAidRoom||'NOT SET',''],
    ['AED',site.aedLocation||'NOT SET','critical'],
    ['MUSTER POINT',site.musterPoint||'NOT SET',''],
    ['SITE PROCEDURE',site.emergencyProcedure||'NOT SET',''],
    ['CASUALTY',casualty,'critical'],
    ['RESPONSIVE',answerText(answers.responsive),''],
    ['BREATHING',answerText(answers.breathing),'critical'],
    ['SEVERE BLEEDING',answerText(answers.severe_bleeding),'critical'],
    ['GPS',gps,'site'],
  ];
}

export function buildHandoverText(card,snapshot=null,liveLocation=null){
  return ['NOSMO 999 HANDOVER',...buildHandoverLines(card,snapshot,liveLocation).map(([label,value])=>`${label}: ${value}`),'Follow the 999 / 112 operator.'].join('\n');
}

const doc=typeof document!=='undefined'?document:null;
let dialog=null;
let liveLocation=null;

function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function loadCard(){
  if(typeof localStorage==='undefined')return normalizeSiteCard();
  try{return normalizeSiteCard(JSON.parse(localStorage.getItem(SITE_CARD_STORAGE_KEY)||'{}'));}catch{return normalizeSiteCard();}
}
function saveCard(card){
  const value=normalizeSiteCard(card);
  try{localStorage.setItem(SITE_CARD_STORAGE_KEY,JSON.stringify(value));}catch{}
  return value;
}
function clearCard(){try{localStorage.removeItem(SITE_CARD_STORAGE_KEY);}catch{}}
function getSnapshot(){return globalThis.NOSMOEmergency?.getSnapshot?.()||null;}

function ensureDialog(){
  if(dialog||!doc)return dialog;
  dialog=doc.createElement('dialog');
  dialog.id='siteEmergencyCardDialog';
  dialog.className='site-card-dialog';
  dialog.setAttribute('aria-label','Site Emergency Card');
  doc.body.appendChild(dialog);
  return dialog;
}

function openDialog(){
  const target=ensureDialog();
  if(typeof target.showModal==='function'&&!target.open)target.showModal();
  else target.setAttribute('open','');
}
function closeDialog(){if(!dialog)return;if(typeof dialog.close==='function'&&dialog.open)dialog.close();else dialog.removeAttribute('open');}

function updateStatus(){
  if(!doc)return;
  const card=loadCard();
  const value=doc.querySelector('#siteCardStatusValue');
  const detail=doc.querySelector('#siteCardStatusDetail');
  if(value)value.textContent=isSiteCardConfigured(card)?(card.postcode||card.siteName||'READY').slice(0,28):'SET UP';
  if(detail)detail.textContent=isSiteCardConfigured(card)?'999 HANDOVER READY':'999 HANDOVER';
}

function fieldHtml(name,label,value,type='text',full=false){
  const classes=`site-field${full?' full':''}`;
  if(type==='textarea')return `<div class="${classes}"><label for="site-${name}">${label}</label><textarea id="site-${name}" name="${name}" autocomplete="off">${escapeHtml(value)}</textarea></div>`;
  return `<div class="${classes}"><label for="site-${name}">${label}</label><input id="site-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" autocomplete="off"></div>`;
}

function renderEditor(){
  const card=loadCard();
  const target=ensureDialog();
  target.innerHTML=`
    <div class="dialog-banner">SITE EMERGENCY CARD • LOCAL DEVICE ONLY</div>
    <div class="site-card-body">
      <div class="site-card-head"><p class="eyebrow">SET UP BEFORE AN EMERGENCY</p><h2>SITE CARD</h2><p>Store the exact details a 999 operator and ambulance crew need. Keep this current when you move site.</p></div>
      <div class="site-card-local"><strong>OFFLINE / LOCAL:</strong> this site profile stays in this browser on this device. It is not sent to NOSMO or a backend.</div>
      <form id="siteCardForm" class="site-card-form">
        ${fieldHtml('siteName','SITE / PROJECT NAME',card.siteName)}
        ${fieldHtml('postcode','POSTCODE',card.postcode)}
        ${fieldHtml('address','FULL SITE ADDRESS',card.address,'textarea',true)}
        ${fieldHtml('ambulanceAccess','AMBULANCE GATE / ACCESS POINT',card.ambulanceAccess,'textarea',true)}
        ${fieldHtml('siteOffice','SITE OFFICE / EMERGENCY PHONE',card.siteOffice,'tel')}
        ${fieldHtml('firstAidRoom','FIRST AID ROOM / POINT',card.firstAidRoom)}
        ${fieldHtml('aedLocation','AED LOCATION',card.aedLocation)}
        ${fieldHtml('musterPoint','MUSTER POINT',card.musterPoint)}
        ${fieldHtml('emergencyProcedure','SITE EMERGENCY PROCEDURE / EXTRA DIRECTIONS',card.emergencyProcedure,'textarea',true)}
      </form>
      <div class="site-card-actions">
        <button class="site-card-action site-card-save" type="button" data-site-save>SAVE SITE CARD</button>
        <button class="site-card-action site-card-handover" type="button" data-site-handover>999 HANDOVER</button>
        <button class="site-card-action site-card-clear" type="button" data-site-clear>CLEAR LOCAL DATA</button>
        <button class="site-card-action site-card-close" type="button" data-site-close>CLOSE</button>
      </div>
    </div>`;
  target.querySelector('[data-site-save]')?.addEventListener('click',()=>{
    const data=Object.fromEntries(new FormData(target.querySelector('#siteCardForm')).entries());
    saveCard(data);updateStatus();renderEditor();
  });
  target.querySelector('[data-site-handover]')?.addEventListener('click',()=>{
    const data=Object.fromEntries(new FormData(target.querySelector('#siteCardForm')).entries());
    saveCard(data);updateStatus();renderHandover();
  });
  target.querySelector('[data-site-clear]')?.addEventListener('click',()=>{if(globalThis.confirm?.('Clear the Site Card stored on this device?')){clearCard();updateStatus();renderEditor();}});
  target.querySelector('[data-site-close]')?.addEventListener('click',closeDialog);
  openDialog();
}

function lineHtml([label,value,cls]){return `<div class="handover-line ${cls||''}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;}

function renderHandover(){
  const card=loadCard();
  const snapshot=getSnapshot();
  const lines=buildHandoverLines(card,snapshot,liveLocation);
  const text=buildHandoverText(card,snapshot,liveLocation);
  const target=ensureDialog();
  const missing=!isSiteCardConfigured(card);
  target.innerHTML=`
    <div class="dialog-banner">999 HANDOVER • READ EXACT SITE ACCESS DETAILS</div>
    <div class="site-card-body handover-view-card">
      <div class="handover-head"><p class="eyebrow">EMERGENCY OPERATOR BRIEF</p><h2>999 HANDOVER</h2><p>Read the site, access and casualty details to the operator. The app does not send this information automatically.</p></div>
      ${missing?'<div class="site-card-warning">SITE CARD IS NOT SET UP. Give the operator the exact address, postcode and ambulance access point verbally.</div>':''}
      <div class="handover-lines">${lines.map(lineHtml).join('')}</div>
      <div class="handover-actions">
        <button class="handover-action handover-call" type="button" data-handover-call="999">CALL 999</button>
        <button class="handover-action handover-call secondary" type="button" data-handover-call="112">CALL 112</button>
        <button class="handover-action handover-read" type="button" data-handover-read>READ ALOUD</button>
        <button class="handover-action handover-copy" type="button" data-handover-copy>COPY</button>
        <button class="handover-action handover-share" type="button" data-handover-share>SHARE</button>
        <button class="handover-action handover-gps" type="button" data-handover-gps>UPDATE GPS</button>
        <button class="handover-action handover-edit" type="button" data-handover-edit>EDIT SITE CARD</button>
        <button class="handover-action handover-close" type="button" data-handover-close>CLOSE</button>
      </div>
    </div>`;
  target.querySelectorAll('[data-handover-call]').forEach((button)=>button.addEventListener('click',()=>{
    const number=button.dataset.handoverCall;
    if(globalThis.NOSMOEmergency?.openDialler)globalThis.NOSMOEmergency.openDialler(number);else if(typeof window!=='undefined')window.location.href=`tel:${number}`;
  }));
  target.querySelector('[data-handover-read]')?.addEventListener('click',()=>speak(text));
  target.querySelector('[data-handover-copy]')?.addEventListener('click',()=>copyText(text));
  target.querySelector('[data-handover-share]')?.addEventListener('click',()=>shareText(text));
  target.querySelector('[data-handover-gps]')?.addEventListener('click',updateGps);
  target.querySelector('[data-handover-edit]')?.addEventListener('click',renderEditor);
  target.querySelector('[data-handover-close]')?.addEventListener('click',closeDialog);
  openDialog();
}

function speak(text){
  if(typeof window==='undefined'||!('speechSynthesis'in window))return;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text.replaceAll('\n','. '));
  utterance.lang='en-GB';utterance.rate=.9;window.speechSynthesis.speak(utterance);
}

async function copyText(text){
  try{await navigator.clipboard.writeText(text);return;}catch{}
  if(!doc)return;
  const area=doc.createElement('textarea');area.value=text;doc.body.appendChild(area);area.select();try{doc.execCommand('copy');}catch{}area.remove();
}
async function shareText(text){
  try{if(navigator.share){await navigator.share({title:'NOSMO 999 HANDOVER',text});return;}}catch{return;}
  await copyText(text);
}
function updateGps(){
  if(!navigator.geolocation)return;
  navigator.geolocation.getCurrentPosition((position)=>{
    liveLocation={status:'AVAILABLE',latitude:position.coords.latitude,longitude:position.coords.longitude,accuracyMetres:position.coords.accuracy};
    renderHandover();
  },()=>{renderHandover();},{enableHighAccuracy:true,timeout:8000,maximumAge:10000});
}

if(doc){
  doc.querySelector('#siteCardHome')?.addEventListener('click',renderEditor);
  doc.querySelector('#siteCardStatus')?.addEventListener('click',()=>isSiteCardConfigured(loadCard())?renderHandover():renderEditor());
  updateStatus();
}
