import { AgeGroup, Answer, IncidentState, Scenario, createIncident, getQuestionCopy, getScenarioCopy, reduceIncident } from './emergency-state.js';

const refs = {
  startScreen: document.querySelector('#startScreen'), emergencyScreen: document.querySelector('#emergencyScreen'),
  activateButton: document.querySelector('#activateButton'), elapsedTime: document.querySelector('#elapsedTime'),
  voiceToggle: document.querySelector('#voiceToggle'), callStatus: document.querySelector('#callStatus'),
  locationStatus: document.querySelector('#locationStatus'), locationStatusValue: document.querySelector('#locationStatusValue'),
  locationStatusDetail: document.querySelector('#locationStatusDetail'), decisionPanel: document.querySelector('#decisionPanel'),
  cancelButton: document.querySelector('#cancelButton'), callDialog: document.querySelector('#callDialog'),
  closeCallDialog: document.querySelector('#closeCallDialog'), toast: document.querySelector('#toast'),
};

let incident = null;
let voiceEnabled = true;
let lastSpokenKey = null;
let elapsedTimer = null;
let toastTimer = null;
let rhythmTimer = null;
let rhythmAudio = null;
let rhythmActive = false;
let wakeLock = null;

function now(){ return new Date().toISOString(); }
function dispatch(action){ if(!incident)return; incident=reduceIncident(incident,action,now()); render(); }

function activateEmergency(){
  if(incident)return;
  incident=createIncident(now());
  refs.startScreen.hidden=true; refs.emergencyScreen.hidden=false; document.body.classList.add('emergency-active');
  startElapsedTimer(); requestFullscreen(); requestWakeLock(); render();
}

async function requestFullscreen(){ try{ if(!document.fullscreenElement&&document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen({navigationUI:'hide'}); }catch{} }
async function requestWakeLock(){ try{ if('wakeLock' in navigator) wakeLock=await navigator.wakeLock.request('screen'); }catch{ wakeLock=null; } }
function startElapsedTimer(){ updateElapsed(); elapsedTimer=window.setInterval(updateElapsed,1000); }
function updateElapsed(){ if(!incident)return; const seconds=Math.max(0,Math.floor((Date.now()-Date.parse(incident.activatedAt))/1000)); refs.elapsedTime.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; refs.elapsedTime.dateTime=`PT${seconds}S`; }

function render(){
  if(!incident)return;
  renderLocationStatus();
  if(incident.state!==IncidentState.GUIDANCE && rhythmActive) stopRhythm(false);
  if(incident.state===IncidentState.ASSESSING) renderQuestion();
  else if(incident.state===IncidentState.SCENARIO_PICKER) renderScenarioPicker();
  else if(incident.state===IncidentState.AGE_SELECT) renderAgePicker();
  else if(incident.state===IncidentState.GUIDANCE) renderGuidance();
  else if(incident.state===IncidentState.CANCELLED) renderCancelled();
}

function renderQuestion(){
  const q=getQuestionCopy(incident.currentQuestion); if(!q)return;
  refs.decisionPanel.innerHTML=`<div class="question-view"><div class="instruction-copy"><p class="eyebrow">${q.eyebrow}</p><h2>${q.title}</h2><p>${q.detail}</p></div><div class="answer-grid" aria-label="Answer choices"><button class="answer-button answer-yes" data-answer="YES">YES</button><button class="answer-button answer-no" data-answer="NO">NO</button><button class="answer-button answer-unknown" data-answer="UNKNOWN">NOT SURE</button><button class="answer-button answer-voice" data-call-help>999 / 112<span>OPEN DIALLER</span></button></div></div>`;
  refs.decisionPanel.querySelectorAll('[data-answer]').forEach((b)=>b.addEventListener('click',()=>dispatch({type:'ANSWER',answer:Answer[b.dataset.answer]})));
  refs.decisionPanel.querySelector('[data-call-help]')?.addEventListener('click',openCallDialog);
  speakOnce(`q:${incident.currentQuestion}`,`${q.title}. ${q.detail}`);
}

const scenarioChoices=[
  [Scenario.CPR,'CPR','NOT BREATHING','danger'],[Scenario.CHOKING,'CHOKING','AIRWAY BLOCKED','airway'],
  [Scenario.STROKE,'STROKE','FAST','stroke'],[Scenario.ANAPHYLAXIS,'ANAPHYLAXIS','SEVERE ALLERGY','allergy'],
  [Scenario.SEVERE_BLEEDING,'SEVERE BLEEDING','PRESS HARD','bleeding'],[Scenario.OPERATOR,'NOT SURE','CALL OPERATOR','operator'],
];
function renderScenarioPicker(){
  const buttons=scenarioChoices.map(([id,title,small,cls])=>`<button class="scenario-choice ${cls}" data-scenario="${id}">${title}<small>${small}</small></button>`).join('');
  refs.decisionPanel.innerHTML=`<div class="scenario-picker"><div class="scenario-copy"><p class="eyebrow">QUICK EMERGENCY ROUTING</p><h2>WHAT IS HAPPENING?</h2><p>Choose the closest match. If unsure, use NOT SURE and call 999 / 112.</p></div><div class="scenario-choice-grid">${buttons}</div></div>`;
  refs.decisionPanel.querySelectorAll('[data-scenario]').forEach((b)=>b.addEventListener('click',()=>dispatch({type:'SELECT_SCENARIO',scenario:b.dataset.scenario})));
  speakOnce('scenario-picker','What is happening? Choose CPR, choking, stroke, anaphylaxis, severe bleeding, or not sure.');
}

function renderAgePicker(){
  const isCpr=incident.scenario===Scenario.CPR;
  refs.decisionPanel.innerHTML=`<div class="age-picker"><div class="age-copy"><p class="eyebrow">${isCpr?'CPR':'CHOKING'} — AGE</p><h2>WHO NEEDS HELP?</h2><p>Choose the age group so the physical technique is correct.</p></div><div class="age-choice-grid"><button class="age-choice adult" data-age="adult">ADULT<small>ADULT / ADOLESCENT</small></button><button class="age-choice child" data-age="child">CHILD<small>1–18 YEARS</small></button><button class="age-choice infant" data-age="infant">BABY<small>UNDER 1 YEAR</small></button><button class="age-choice back" data-back-scenarios>BACK<small>CHOOSE ANOTHER EMERGENCY</small></button></div></div>`;
  refs.decisionPanel.querySelectorAll('[data-age]').forEach((b)=>b.addEventListener('click',()=>dispatch({type:'SELECT_AGE',ageGroup:b.dataset.age})));
  refs.decisionPanel.querySelector('[data-back-scenarios]')?.addEventListener('click',()=>dispatch({type:'BACK_TO_SCENARIOS'}));
  speakOnce(`age:${incident.scenario}`,'Choose adult, child, or baby.');
}

function renderGuidance(){
  const g=getScenarioCopy(incident.scenario,incident.ageGroup); if(!g){ dispatch({type:'BACK_TO_SCENARIOS'}); return; }
  const steps=g.steps.map((step,i)=>`<div class="guidance-step"><span class="guidance-number">${i+1}</span><p>${step}</p></div>`).join('');
  const rhythm=g.rhythm?`<div class="cpr-rhythm"><div id="rhythmOrb" class="rhythm-orb">110</div><button class="rhythm-control" data-rhythm>${rhythmActive?'STOP CPR RHYTHM':'START CPR RHYTHM'}<span>110 COMPRESSIONS / MIN</span></button></div>`:'';
  refs.decisionPanel.innerHTML=`<div class="guidance-view"><div class="guidance-copy ${g.tone}"><p class="eyebrow">${g.eyebrow}</p><h2>${g.title}</h2><div class="guidance-steps">${steps}</div>${rhythm}</div><div class="guidance-actions"><button class="call-action primary-call compact" data-call="999">CALL 999<span>OPENS DIALLER</span></button><button class="call-action compact" data-call="112">CALL 112<span>OPENS DIALLER</span></button><button class="next-action compact" data-back-scenarios>OTHER EMERGENCY<span>BACK TO QUICK ROUTING</span></button><button class="next-action compact" data-repeat>READ AGAIN<span>VOICE GUIDANCE</span></button></div></div>`;
  refs.decisionPanel.querySelectorAll('[data-call]').forEach((b)=>b.addEventListener('click',()=>openDialler(b.dataset.call)));
  refs.decisionPanel.querySelector('[data-back-scenarios]')?.addEventListener('click',()=>dispatch({type:'BACK_TO_SCENARIOS'}));
  refs.decisionPanel.querySelector('[data-repeat]')?.addEventListener('click',()=>speakGuidance(g));
  refs.decisionPanel.querySelector('[data-rhythm]')?.addEventListener('click',toggleRhythm);
  speakOnce(`guidance:${incident.scenario}:${incident.ageGroup||'na'}`,`${g.title}. ${g.steps.join('. ')}`);
}

function renderCancelled(){
  refs.cancelButton.hidden=true;
  refs.decisionPanel.innerHTML=`<div class="cancelled-view"><p class="eyebrow danger-text">EMERGENCY MODE EXITED</p><h2>LOCAL SESSION ENDED</h2><p>No call or responder notification is claimed by this app. If help is still needed, call 999 or 112.</p><button class="reset-action" data-reset>RESET</button></div>`;
  refs.decisionPanel.querySelector('[data-reset]')?.addEventListener('click',resetEmergency);
}

function openCallDialog(){ if(typeof refs.callDialog.showModal==='function')refs.callDialog.showModal(); else refs.callDialog.setAttribute('open',''); }
function closeCallDialog(){ if(typeof refs.callDialog.close==='function')refs.callDialog.close(); else refs.callDialog.removeAttribute('open'); }
function openDialler(number){ if(incident) incident=reduceIncident(incident,{type:'CALL_DIALER_OPENED',number},now()); showToast(`OPENING ${number} DIALLER • CONNECTION NOT CONFIRMED`); window.location.href=`tel:${number}`; }

function requestLocation(){
  if(!incident)return;
  incident=reduceIncident(incident,{type:'LOCATION_REQUESTING'},now()); renderLocationStatus();
  if(!navigator.geolocation){ incident=reduceIncident(incident,{type:'LOCATION_FAILED',status:'UNAVAILABLE'},now()); return renderLocationStatus(); }
  navigator.geolocation.getCurrentPosition((p)=>{incident=reduceIncident(incident,{type:'LOCATION_AVAILABLE',latitude:p.coords.latitude,longitude:p.coords.longitude,accuracyMetres:p.coords.accuracy},now());renderLocationStatus();},(e)=>{incident=reduceIncident(incident,{type:'LOCATION_FAILED',status:e.code===e.PERMISSION_DENIED?'DENIED':'UNAVAILABLE'},now());renderLocationStatus();},{enableHighAccuracy:true,timeout:8000,maximumAge:15000});
}
function renderLocationStatus(){
  if(!incident)return;
  const l=incident.location;
  refs.locationStatusValue.classList.toggle('location-available',l.status==='AVAILABLE');
  if(l.status==='AVAILABLE'){ refs.locationStatusValue.textContent=`GPS ±${Math.round(l.accuracyMetres)}M`; refs.locationStatusDetail.textContent=`${l.latitude.toFixed(5)}, ${l.longitude.toFixed(5)} • DEVICE ONLY`; }
  else if(l.status==='REQUESTING'){ refs.locationStatusValue.textContent='REQUESTING'; refs.locationStatusDetail.textContent='DEVICE PERMISSION'; }
  else if(l.status==='DENIED'){ refs.locationStatusValue.textContent='GPS DENIED'; refs.locationStatusDetail.textContent='TAP TO RETRY'; }
  else if(l.status==='UNAVAILABLE'){ refs.locationStatusValue.textContent='GPS UNAVAILABLE'; refs.locationStatusDetail.textContent='TAP TO RETRY'; }
  else { refs.locationStatusValue.textContent='TAP TO GET'; refs.locationStatusDetail.textContent='DEVICE ONLY'; }
}

function toggleVoice(){ voiceEnabled=!voiceEnabled; refs.voiceToggle.textContent=voiceEnabled?'VOICE ON':'VOICE OFF'; refs.voiceToggle.setAttribute('aria-pressed',String(voiceEnabled)); if(!voiceEnabled&&'speechSynthesis'in window)window.speechSynthesis.cancel(); if(voiceEnabled){lastSpokenKey=null;render();} }
function speakOnce(key,words){ if(!voiceEnabled||lastSpokenKey===key)return; lastSpokenKey=key; speak(words); }
function speakGuidance(g){ speak(`${g.title}. ${g.steps.join('. ')}`); }
function speak(words){ if(!voiceEnabled||!('speechSynthesis'in window))return; window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(words);u.lang='en-GB';u.rate=.92;window.speechSynthesis.speak(u); }

function toggleRhythm(){ rhythmActive?stopRhythm(true):startRhythm(); }
function startRhythm(){
  rhythmActive=true; let beatCount=0; const interval=Math.round(60000/110);
  const beat=()=>{ const orb=document.querySelector('#rhythmOrb'); if(orb){orb.classList.add('beat');setTimeout(()=>orb.classList.remove('beat'),100);} beep(); beatCount++; if(navigator.vibrate&&beatCount%2===0)navigator.vibrate(30); };
  beat(); rhythmTimer=window.setInterval(beat,interval); renderGuidance();
}
function stopRhythm(rerender){ if(rhythmTimer)clearInterval(rhythmTimer);rhythmTimer=null;rhythmActive=false;if(rhythmAudio){rhythmAudio.close().catch(()=>{});rhythmAudio=null;}if(navigator.vibrate)navigator.vibrate(0);if(rerender&&incident?.state===IncidentState.GUIDANCE)renderGuidance(); }
function beep(){ try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!rhythmAudio)rhythmAudio=new C();const o=rhythmAudio.createOscillator(),g=rhythmAudio.createGain();o.frequency.value=740;g.gain.setValueAtTime(.12,rhythmAudio.currentTime);g.gain.exponentialRampToValueAtTime(.001,rhythmAudio.currentTime+.07);o.connect(g).connect(rhythmAudio.destination);o.start();o.stop(rhythmAudio.currentTime+.075);}catch{} }

function cancelEmergency(){ stopRhythm(false); if('speechSynthesis'in window)window.speechSynthesis.cancel(); dispatch({type:'CANCEL'}); if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{}); }
function resetEmergency(){ cleanup(); incident=null;lastSpokenKey=null;refs.cancelButton.hidden=false;refs.emergencyScreen.hidden=true;refs.startScreen.hidden=false;refs.elapsedTime.textContent='00:00';document.body.classList.remove('emergency-active');refs.activateButton.focus(); }
function cleanup(){ if(elapsedTimer)clearInterval(elapsedTimer);elapsedTimer=null;stopRhythm(false);if(wakeLock)wakeLock.release().catch(()=>{});wakeLock=null;if('speechSynthesis'in window)window.speechSynthesis.cancel(); }
function showToast(message){refs.toast.textContent=message;refs.toast.hidden=false;if(toastTimer)clearTimeout(toastTimer);toastTimer=setTimeout(()=>refs.toast.hidden=true,3200);}

refs.activateButton.addEventListener('click',activateEmergency);
refs.voiceToggle.addEventListener('click',toggleVoice);
refs.cancelButton.addEventListener('click',cancelEmergency);
refs.callStatus.addEventListener('click',openCallDialog);
refs.locationStatus.addEventListener('click',requestLocation);
refs.closeCallDialog.addEventListener('click',closeCallDialog);
refs.callDialog.addEventListener('click',(e)=>{const b=e.target.closest('[data-call]');if(b){closeCallDialog();openDialler(b.dataset.call);}});
window.addEventListener('beforeunload',cleanup);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&incident&&!wakeLock)requestWakeLock();});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
