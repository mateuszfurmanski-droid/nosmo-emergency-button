export const SITE_MEDICAL_SCENARIOS = Object.freeze({
  open_chest_wound: {
    label:'OPEN CHEST WOUND', small:'LEAVE OPEN • CALL 999', cls:'chest', tone:'danger',
    steps:[
      'Call 999 or 112 now.',
      'Leave the open chest wound exposed to the air. Do not cover it with an improvised dressing or seal it closed.',
      'If there is localised bleeding, use direct pressure around the wound without blocking the opening.',
      'Only if you are trained and have the correct equipment, use a specialised non-occlusive or vented chest dressing and make sure air can still escape.',
      'Monitor breathing continuously. If normal breathing stops, start CPR and follow the emergency operator.'
    ]
  },
  fracture_dislocation: {
    label:'FRACTURE / JOINT', small:'SUPPORT • DO NOT STRAIGHTEN', cls:'fracture', tone:'ready',
    steps:[
      'Keep the injured part still and support it in the position found. Do not try to straighten a fracture or put a dislocated joint back in place.',
      'Call 999/112 for an open fracture, suspected back/neck/pelvis injury, major long-bone injury, severe deformity, heavy bleeding, loss of feeling/circulation, or if the person cannot be moved safely.',
      'For an open fracture, cover the wound with a sterile dressing or clean non-fluffy cloth and control bleeding around the wound. Do not press directly on protruding bone.',
      'Remove rings, watches or tight items near the injury before swelling increases, if this can be done without moving the injury.',
      'If it is a smaller stable injury, arrange prompt assessment at A&E or an Urgent Treatment Centre. Do not let them put weight on an injured lower limb.'
    ]
  },
  eye_injury: {
    label:'EYE INJURY', small:'CHEMICAL • IMPACT • DUST', cls:'eye', tone:'ready',
    steps:[
      'Do not rub the eye and do not try to remove an embedded or penetrating object.',
      'Call 999 or go to A&E for a chemical in the eye, penetrating injury, high-speed impact, vision change, severe pain, blood from the eye, or inability to open or move the eye.',
      'For a chemical splash, start rinsing immediately with lots of clean water and continue for at least 20 minutes while help is arranged. Keep contaminated water away from the other eye and from rescuers.',
      'For loose dust or a small surface particle, rinse gently with clean water. Remove contact lenses if the person can do so easily.',
      'If pain, blurred vision or the object remains, get urgent medical assessment.'
    ]
  },
  fume_inhalation: {
    label:'DUST / FUMES', small:'FRESH AIR • SAFE ACCESS', cls:'airway', tone:'danger',
    steps:[
      'Do not enter a contaminated or confined area unless it is confirmed safe and you have the correct respiratory protection and rescue procedure.',
      'If it is safe, move the person into fresh air away from dust, smoke, gas or fumes and loosen tight clothing.',
      'Call 999 for severe breathlessness, noisy or difficult breathing, collapse, confusion, blue/grey colour, chest pain, significant smoke or chemical-fume exposure, or exposure in an enclosed space.',
      'Keep them in the position that makes breathing easiest. If trained to give oxygen, follow your training and site protocol.',
      'If they become unresponsive and are not breathing normally, start CPR and use an AED if available.'
    ]
  },
  heat_illness: {
    label:'HEAT ILLNESS', small:'COOL FAST', cls:'heat', tone:'ready',
    steps:[
      'Move them to a cool place, remove unnecessary outer clothing and stay with them.',
      'If they are fully awake and can swallow, give cool water or an oral rehydration/isotonic drink.',
      'Cool the skin with cool water, wet towels or sponging and fan them. Wrapped cold packs can be placed at the neck or armpits.',
      'Call 999 if they are still unwell after about 30 minutes of cooling and fluids, or if they have confusion, loss of coordination, a seizure, loss of consciousness, very high temperature, or severe breathing difficulty.',
      'If they become unresponsive but are breathing, use the recovery position. If normal breathing stops, start CPR.'
    ]
  },
  hypothermia: {
    label:'HYPOTHERMIA', small:'SHELTER • INSULATE', cls:'cold', tone:'danger',
    steps:[
      'Call 999 if hypothermia is suspected.',
      'Move them to shelter if this can be done safely. Gently remove wet clothing and replace it with dry clothing or blankets. Cover the head and insulate them from the cold ground.',
      'If they are fully awake and able to swallow, give a warm non-alcoholic drink and sugary food.',
      'Do not use a hot bath, heat lamp or hot water bottle. Do not rub the arms, legs, hands or feet and do not give alcohol.',
      'Handle them gently and monitor breathing. If normal breathing stops, start CPR and follow the 999 operator.'
    ]
  },
  seizure: {
    label:'SEIZURE', small:'PROTECT • TIME IT', cls:'seizure', tone:'ready',
    steps:[
      'Clear dangerous objects away, protect their head with something soft and note the time the seizure started.',
      'Do not restrain them, do not move them unless they are in immediate danger, and do not put anything in their mouth.',
      'When jerking stops, open the airway and check breathing. If they are breathing normally, place them in the recovery position and monitor them.',
      'Call 999/112 if it is their first seizure, seizures repeat, the cause is unknown, the seizure lasts more than 5 minutes, they remain unresponsive for more than 10 minutes afterwards, they are injured, or breathing is not normal.',
      'If they are not breathing normally, start CPR.'
    ]
  },
  hypoglycaemia: {
    label:'DIABETIC HYPO', small:'LOW BLOOD SUGAR', cls:'diabetic', tone:'ready',
    steps:[
      'Suspect low blood sugar in a person with diabetes who suddenly becomes shaky, sweaty, confused, irritable, drowsy or behaves unusually.',
      'If they are awake and can swallow safely, give 15–20 g of fast-acting glucose, such as glucose/dextrose tablets or a sugary drink.',
      'If possible, check blood glucose. If symptoms are not improving after about 15 minutes, give another fast-acting sugar treatment.',
      'Once recovered, give a longer-acting carbohydrate snack or meal if available.',
      'If they are unresponsive or cannot swallow safely, give nothing by mouth. Call 999, check breathing, use the recovery position if breathing normally, and start CPR if normal breathing stops.'
    ]
  }
});

const panel = typeof document !== 'undefined' ? document.querySelector('#decisionPanel') : null;
let medicalDialog = null;

function ensureDialog(){
  if (medicalDialog || typeof document === 'undefined') return medicalDialog;
  medicalDialog = document.createElement('dialog');
  medicalDialog.id = 'siteMedicalDialog';
  medicalDialog.className = 'call-dialog site-medical-dialog';
  document.body.appendChild(medicalDialog);
  return medicalDialog;
}

function speak(words){
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(words);
  utterance.lang = 'en-GB';
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
}

function openDialler(number){
  if (typeof window === 'undefined') return;
  window.location.href = `tel:${number}`;
}

function showMedicalScenario(id){
  const scenario = SITE_MEDICAL_SCENARIOS[id];
  if (!scenario) return;
  const dialog = ensureDialog();
  const steps = scenario.steps.map((step,index)=>`<div class="guidance-step"><span class="guidance-number">${index+1}</span><p>${step}</p></div>`).join('');
  dialog.innerHTML = `
    <div class="dialog-banner">SITE MEDICAL GUIDANCE • FOLLOW 999 / 112 OPERATOR</div>
    <div class="site-medical-body">
      <div class="guidance-copy ${scenario.tone}">
        <p class="eyebrow">${scenario.label}</p>
        <h2>${scenario.label}</h2>
        <div class="guidance-steps">${steps}</div>
      </div>
      <div class="guidance-actions site-medical-actions">
        <button class="call-action primary-call compact" type="button" data-site-call="999">CALL 999<span>OPENS DIALLER</span></button>
        <button class="call-action compact" type="button" data-site-call="112">CALL 112<span>OPENS DIALLER</span></button>
        <button class="next-action compact" type="button" data-site-back>BACK<span>RETURN TO ROUTING</span></button>
        <button class="next-action compact" type="button" data-site-read>READ AGAIN<span>VOICE GUIDANCE</span></button>
      </div>
    </div>`;
  dialog.querySelectorAll('[data-site-call]').forEach((button)=>button.addEventListener('click',()=>openDialler(button.dataset.siteCall)));
  dialog.querySelector('[data-site-back]')?.addEventListener('click',()=>dialog.close());
  dialog.querySelector('[data-site-read]')?.addEventListener('click',()=>speak(`${scenario.label}. ${scenario.steps.join('. ')}`));
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
  speak(`${scenario.label}. ${scenario.steps.join('. ')}`);
}

function enhanceScenarioPicker(){
  if (!panel) return;
  const grid = panel.querySelector('.scenario-choice-grid');
  if (!grid || grid.querySelector('[data-site-scenario]')) return;
  for (const [id,scenario] of Object.entries(SITE_MEDICAL_SCENARIOS)){
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `scenario-choice ${scenario.cls}`;
    button.dataset.siteScenario = id;
    button.innerHTML = `${scenario.label}<small>${scenario.small}</small>`;
    button.addEventListener('click',()=>showMedicalScenario(id));
    grid.appendChild(button);
  }
}

if (panel && typeof MutationObserver !== 'undefined'){
  const observer = new MutationObserver(enhanceScenarioPicker);
  observer.observe(panel,{childList:true,subtree:true});
  enhanceScenarioPicker();
}
