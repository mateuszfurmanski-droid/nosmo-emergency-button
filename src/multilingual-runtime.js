import { LANGUAGES, getLanguage, translate, hasDirectTranslation } from './i18n.js';
import { SITE_LANGUAGE } from './site-language.js';

export { SITE_LANGUAGE };
export const LANGUAGE_STORAGE_KEY='nosmo-emergency-language-v1';

const TEXT_KEYS=Object.freeze({
  'EMERGENCY':'emergency_button','PRESS ONCE':'press_for_help','YES':'yes','NO':'no','NOT SURE':'unknown','CALL 999':'call_999','CALL 112':'call_112','LOCATION':'location','EMERGENCY MODE':'emergency_mode','WHAT IS HAPPENING?':'pick_title',
  'IS THE AREA SAFE TO ENTER?':'question_scene_title','Check for traffic, electricity, fire, smoke, gas, chemicals or moving machinery.':'question_scene_detail',
  'IS THE PERSON RESPONDING?':'question_responsive_title','Speak loudly and ask them to open their eyes. Do not shake an injured person.':'question_responsive_detail',
  'ARE THEY BREATHING NORMALLY?':'question_breathing_title','Look and listen for normal breathing. Gasping or irregular breaths are not normal.':'question_breathing_detail',
  'IS THERE LIFE-THREATENING BLEEDING?':'question_bleeding_title','Look for heavy, pumping or rapidly soaking bleeding.':'question_bleeding_detail',
  'CPR':'cpr_not_breathing','CHOKING':'scenario_choking_adult','SEVERE BLEEDING':'scenario_severe_bleeding','FALL / HEAD / SPINE':'scenario_head_spine','CRUSH / ENTRAPMENT':'scenario_crush','ELECTRICAL':'scenario_burn_electrical','SERIOUS BURN':'scenario_burn_thermal','CHEMICAL BURN':'scenario_burn_chemical','AMPUTATION':'scenario_amputation','STROKE':'scenario_stroke','ANAPHYLAXIS':'scenario_anaphylaxis',
  'FRACTURE / JOINT':'scenario_fracture','DUST / FUMES':'scenario_inhalation','HEAT ILLNESS':'scenario_heat','HYPOTHERMIA':'scenario_hypothermia','SEIZURE':'scenario_seizure','DIABETIC HYPO':'scenario_diabetic',
  'Call 999 or 112 on speaker. If the person is unresponsive and not breathing normally, start CPR.':'cpr_call_speaker',
  'Place the heel of one hand in the centre of the chest, the other hand on top, arms straight.':'cpr_adult_compressions',
  'Compress 5–6 cm deep at 100–120 compressions per minute. Allow full chest recoil and minimise pauses.':'cpr_adult_rate_depth',
  'If trained and willing, give 30 compressions then 2 breaths. If not, continue chest-compression-only CPR.':'cpr_adult_breaths',
  'Use an AED as soon as it arrives. Switch it on and follow its prompts.':'cpr_aed',
  'Apply firm, direct manual pressure to the bleeding site now.':'bleed_direct_pressure',
  'If they can cough effectively, encourage coughing and watch closely.':'choke_cough',
  'If the cough is ineffective, give up to 5 firm back blows between the shoulder blades, checking after each one.':'choke_back_blows',
  'If still choking, give up to 5 abdominal thrusts. Alternate 5 back blows and 5 abdominal thrusts.':'choke_abdominal',
  'If they become unresponsive, call 999/112 and start CPR. Do not perform a blind finger sweep.':'choke_unresponsive_cpr',
  'Use their adrenaline auto-injector immediately if available, following the device instructions.':'anaphylaxis_adrenaline',
  'If symptoms have not improved after 5 minutes and a second auto-injector is available, use it.':'anaphylaxis_second',
  'Cool the burn under cool or lukewarm running water for 20 minutes as soon as possible.':'burn_cool_20',
  'If a dry chemical is present and it is safe, brush it off carefully while protecting yourself.':'chemical_brush',
  'Time the seizure from the start.':'seizure_time',
  'Do not restrain them and do not put anything in their mouth.':'seizure_nothing_mouth',
  'Move them out of the heat and remove excess outer clothing.':'heat_remove',
  'Move them to shelter from wind and cold if safe. Handle them gently.':'hypothermia_shelter'
});

const SITE_ENGLISH=Object.freeze({
  'SITE CARD':'siteCard','SITE / PROJECT NAME':'project','FULL SITE ADDRESS':'address','POSTCODE':'postcode','AMBULANCE GATE / ACCESS POINT':'ambulance','SITE OFFICE / EMERGENCY PHONE':'office','FIRST AID ROOM / POINT':'firstAid','AED LOCATION':'aed','MUSTER POINT':'muster','SITE EMERGENCY PROCEDURE / EXTRA DIRECTIONS':'procedure','SAVE SITE CARD':'save','999 HANDOVER':'handover','CLEAR LOCAL DATA':'clear','CLOSE':'close','SET UP':'setup','READY':'ready','999 HANDOVER READY':'handoverReady','EDIT SITE CARD':'edit','UPDATE GPS':'gps','COPY':'copy','SHARE':'share'
});

const nodeDescriptors=new WeakMap();
let currentCode=detectLanguage();
let languageDialog=null;

function detectLanguage(){
  try{const stored=localStorage.getItem(LANGUAGE_STORAGE_KEY);if(stored&&LANGUAGES.some((l)=>l.code===stored))return stored;}catch{}
  const candidates=typeof navigator!=='undefined'?[...(navigator.languages||[]),navigator.language].filter(Boolean):[];
  for(const candidate of candidates){const base=String(candidate).toLowerCase().split('-')[0];if(LANGUAGES.some((l)=>l.code===base))return base;}
  return 'en';
}

function getDescriptor(node){
  if(nodeDescriptors.has(node))return nodeDescriptors.get(node);
  const raw=node.nodeValue||'';
  const match=raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const text=(match?.[2]||'').trim();
  let descriptor=null;
  if(TEXT_KEYS[text])descriptor={type:'i18n',key:TEXT_KEYS[text],prefix:match?.[1]||'',suffix:match?.[3]||''};
  else if(SITE_ENGLISH[text])descriptor={type:'site',key:SITE_ENGLISH[text],prefix:match?.[1]||'',suffix:match?.[3]||''};
  nodeDescriptors.set(node,descriptor);
  return descriptor;
}

function translateTextNode(node){
  const descriptor=getDescriptor(node);
  const parent=node.parentElement;
  if(!descriptor){
    if(currentCode!=='en'&&parent?.matches('.guidance-step p')&&/[A-Za-z]{4}/.test((node.nodeValue||'').trim()))parent.dataset.i18nUntranslated='true';
    return;
  }
  let value='';
  let direct=true;
  if(descriptor.type==='i18n'){
    value=translate(currentCode,descriptor.key);
    direct=currentCode==='en'||hasDirectTranslation(currentCode,descriptor.key);
  }else value=(SITE_LANGUAGE[currentCode]||SITE_LANGUAGE.en)[descriptor.key]||SITE_LANGUAGE.en[descriptor.key];
  node.nodeValue=`${descriptor.prefix}${value}${descriptor.suffix}`;
  if(parent){
    if(direct)delete parent.dataset.i18nFallback;
    else parent.dataset.i18nFallback='true';
    delete parent.dataset.i18nUntranslated;
  }
}

function translateSubtree(root){
  if(typeof document==='undefined'||!root)return;
  if(root.nodeType===Node.TEXT_NODE){translateTextNode(root);return;}
  if(root.nodeType!==Node.ELEMENT_NODE&&root!==document.body)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(translateTextNode);
}

function markFallbackGuidance(){
  if(typeof document==='undefined')return;
  document.querySelectorAll('.translation-fallback-note').forEach((n)=>n.remove());
  document.querySelectorAll('[data-i18n-untranslated],[data-i18n-fallback]').forEach((el)=>{if(currentCode==='en'){delete el.dataset.i18nUntranslated;delete el.dataset.i18nFallback;}});
  if(currentCode==='en')return;
  const note=(SITE_LANGUAGE[currentCode]||SITE_LANGUAGE.en).fallback;
  document.querySelectorAll('.guidance-copy,.site-medical-body .guidance-copy').forEach((box)=>{
    if(box.querySelector('[data-i18n-untranslated="true"],[data-i18n-fallback="true"]')){
      const warning=document.createElement('div');warning.className='translation-fallback-note';warning.textContent=note;box.appendChild(warning);
    }
  });
}

function createLanguageButton(context){
  const button=document.createElement('button');button.type='button';button.className=`language-chip${context==='emergency'?' emergency-language-chip':''}`;button.dataset.languageButton=context;
  const flag=document.createElement('span');flag.className='language-flag';const code=document.createElement('strong');code.className='language-code';button.append(flag,code);button.addEventListener('click',openLanguageDialog);return button;
}

function ensureHeaderControls(){
  if(typeof document==='undefined')return;
  const start=document.querySelector('.start-header');const site=document.querySelector('#siteCardHome');
  if(start&&site){
    let tools=start.querySelector('.header-tools');
    if(!tools){tools=document.createElement('div');tools.className='header-tools';start.insertBefore(tools,site);tools.appendChild(site);}
    if(!tools.querySelector('[data-language-button]'))tools.insertBefore(createLanguageButton('home'),site);
  }
  const emergency=document.querySelector('.emergency-header');const voice=document.querySelector('#voiceToggle');
  if(emergency&&voice){
    let tools=emergency.querySelector('.emergency-header-tools');
    if(!tools){tools=document.createElement('div');tools.className='emergency-header-tools';emergency.insertBefore(tools,voice);tools.appendChild(voice);}
    if(!tools.querySelector('[data-language-button]'))tools.insertBefore(createLanguageButton('emergency'),voice);
  }
}

function updateLanguageButtons(){
  if(typeof document==='undefined')return;
  const meta=getLanguage(currentCode);document.documentElement.lang=meta.locale;document.body.classList.toggle('rtl-language',meta.dir==='rtl');
  document.querySelectorAll('[data-language-button]').forEach((button)=>{
    const flag=button.querySelector('.language-flag');const code=button.querySelector('.language-code');
    if(flag&&flag.textContent!==meta.flag)flag.textContent=meta.flag;
    if(code&&code.textContent!==meta.code.toUpperCase())code.textContent=meta.code.toUpperCase();
    button.setAttribute('aria-label',`${(SITE_LANGUAGE[currentCode]||SITE_LANGUAGE.en).language}: ${meta.nativeName}`);
  });
}

export function getCurrentLanguageCode(){return currentCode;}
export function getCurrentLanguage(){return getLanguage(currentCode);}
export function setCurrentLanguage(code){
  if(!LANGUAGES.some((l)=>l.code===code))return false;
  currentCode=code;try{localStorage.setItem(LANGUAGE_STORAGE_KEY,code);}catch{}
  applyLanguage();globalThis.dispatchEvent?.(new CustomEvent('nosmo-language-change',{detail:{code}}));return true;
}

export function applyLanguage(){
  if(typeof document==='undefined')return;
  ensureHeaderControls();updateLanguageButtons();translateSubtree(document.body);markFallbackGuidance();
}

function ensureDialog(){
  if(languageDialog||typeof document==='undefined')return languageDialog;
  languageDialog=document.createElement('dialog');languageDialog.className='language-dialog';languageDialog.id='languageDialog';document.body.appendChild(languageDialog);return languageDialog;
}

function openLanguageDialog(){
  const d=ensureDialog();const shell=SITE_LANGUAGE[currentCode]||SITE_LANGUAGE.en;
  d.innerHTML=`<div class="dialog-banner">${shell.language} • 17 LANGUAGES • LOCAL DEVICE</div><div class="language-dialog-body"><div class="language-dialog-head"><h2>${shell.language}</h2><p>${shell.fallback}</p></div><div class="language-grid">${LANGUAGES.map((l)=>`<button type="button" class="language-choice${l.code===currentCode?' active':''}" data-language="${l.code}"><span>${l.flag}</span><strong>${l.nativeName}</strong><small>${l.name}</small></button>`).join('')}</div><div class="language-operator-note">${shell.operator}</div><button type="button" class="language-close" data-language-close>${shell.close}</button></div>`;
  d.querySelectorAll('[data-language]').forEach((button)=>button.addEventListener('click',()=>{setCurrentLanguage(button.dataset.language);openLanguageDialog();}));
  d.querySelector('[data-language-close]')?.addEventListener('click',()=>d.close());
  if(typeof d.showModal==='function'&&!d.open)d.showModal();else d.setAttribute('open','');
}

if(typeof document!=='undefined'){
  ensureHeaderControls();applyLanguage();
  const observer=new MutationObserver((records)=>{
    let headersMayHaveChanged=false;
    for(const record of records){for(const node of record.addedNodes){if(node.nodeType===Node.ELEMENT_NODE||node.nodeType===Node.TEXT_NODE)translateSubtree(node);if(node.nodeType===Node.ELEMENT_NODE)headersMayHaveChanged=true;}}
    if(headersMayHaveChanged)ensureHeaderControls();updateLanguageButtons();markFallbackGuidance();
  });
  observer.observe(document.body,{childList:true,subtree:true});
}

globalThis.NOSMOLanguage=Object.freeze({getCode:getCurrentLanguageCode,getLanguage:getCurrentLanguage,set:setCurrentLanguage,apply:applyLanguage});
