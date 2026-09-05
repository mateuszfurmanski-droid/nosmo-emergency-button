export const IncidentState = Object.freeze({
  ASSESSING: 'ASSESSING',
  SCENARIO_PICKER: 'SCENARIO_PICKER',
  AGE_SELECT: 'AGE_SELECT',
  GUIDANCE: 'GUIDANCE',
  CANCELLED: 'CANCELLED',
});

export const Answer = Object.freeze({ YES: 'YES', NO: 'NO', UNKNOWN: 'UNKNOWN' });

export const Question = Object.freeze({
  SCENE_SAFE: 'scene_safe',
  RESPONSIVE: 'responsive',
  BREATHING: 'breathing',
  SEVERE_BLEEDING: 'severe_bleeding',
});

export const Scenario = Object.freeze({
  SCENE_UNSAFE: 'scene_unsafe',
  UNCONSCIOUS_BREATHING: 'unconscious_breathing',
  CPR: 'cpr',
  SEVERE_BLEEDING: 'severe_bleeding',
  CHOKING: 'choking',
  STROKE: 'stroke',
  ANAPHYLAXIS: 'anaphylaxis',
  FALL_HEAD_SPINE: 'fall_head_spine',
  CRUSH_INJURY: 'crush_injury',
  ELECTRICAL_INJURY: 'electrical_injury',
  THERMAL_BURN: 'thermal_burn',
  CHEMICAL_BURN: 'chemical_burn',
  AMPUTATION: 'amputation',
  OPERATOR: 'operator',
});

export const AgeGroup = Object.freeze({ ADULT: 'adult', CHILD: 'child', INFANT: 'infant' });

const copy = {
  questions: {
    [Question.SCENE_SAFE]: { eyebrow:'STEP 1 — SCENE SAFETY', title:'IS THE AREA SAFE TO ENTER?', detail:'Check for traffic, electricity, fire, smoke, gas, chemicals or moving machinery.' },
    [Question.RESPONSIVE]: { eyebrow:'STEP 2 — RESPONSE', title:'IS THE PERSON RESPONDING?', detail:'Speak loudly and ask them to open their eyes. Do not shake an injured person.' },
    [Question.BREATHING]: { eyebrow:'STEP 3 — BREATHING', title:'ARE THEY BREATHING NORMALLY?', detail:'Look and listen for normal breathing. Gasping or irregular breaths are not normal.' },
    [Question.SEVERE_BLEEDING]: { eyebrow:'STEP 4 — BLEEDING', title:'IS THERE LIFE-THREATENING BLEEDING?', detail:'Look for heavy, pumping or rapidly soaking bleeding.' },
  },
  scenarios: {
    scene_unsafe: {
      eyebrow:'DANGER — DO NOT ENTER', title:'KEEP YOURSELF SAFE', tone:'danger', call:true,
      steps:['Move other people away from the hazard.', 'Call 999 or 112 and tell the operator what the danger is.', 'Do not touch or approach the casualty until the hazard is controlled or the operator says it is safe.'],
    },
    unconscious_breathing: {
      eyebrow:'UNRESPONSIVE — BREATHING', title:'CALL 999. KEEP THE AIRWAY OPEN.', tone:'ready', call:true,
      steps:['Call 999 or 112 and use speaker mode.', 'Keep the airway open and monitor breathing continuously.', 'If there is no major trauma and the operator advises it, use the recovery position.', 'If normal breathing stops or becomes only gasping, start CPR immediately.'],
    },
    severe_bleeding: {
      eyebrow:'LIFE-THREATENING BLEEDING', title:'PRESS HARD. CALL 999.', tone:'danger', call:true,
      steps:['Apply firm, direct manual pressure to the bleeding site now.', 'Use a standard or haemostatic dressing if available; pack the wound if appropriate and keep firm pressure.', 'When bleeding is controlled, secure a pressure dressing.', 'For life-threatening arm or leg bleeding not controlled by pressure, apply a commercial tourniquet 5–7 cm above the wound, not over a joint. Tighten until bleeding stops, note the time, and do not release it.'],
    },
    stroke: {
      eyebrow:'POSSIBLE STROKE', title:'FAST — CALL 999 NOW', tone:'danger', call:true,
      steps:['FACE: ask them to smile. Look for one side drooping.', 'ARMS: ask them to raise both arms. Look for weakness or numbness.', 'SPEECH: listen for slurred, confused or abnormal speech.', 'TIME: call 999 immediately. Note when symptoms started or when they were last known well. Call even if symptoms have stopped.'],
    },
    anaphylaxis: {
      eyebrow:'SEVERE ALLERGIC REACTION', title:'ADRENALINE. CALL 999.', tone:'danger', call:true,
      steps:['Use their adrenaline auto-injector immediately if available, following the device instructions.', 'Call 999 and say you suspect anaphylaxis.', 'Lie them down. If breathing is very difficult, they may sit up slowly; do not let them stand or walk. If pregnant, lie on the left side.', 'If symptoms have not improved after 5 minutes and a second auto-injector is available, use it.'],
    },
    fall_head_spine: {
      eyebrow:'FALL / HEAD / SPINE TRAUMA', title:'KEEP STILL. CALL 999.', tone:'danger', call:true,
      steps:['For a fall from height, serious head impact, new weakness or numbness, confusion, seizure, or suspected neck/spine injury, call 999.', 'Do not move the person unless there is immediate danger or their airway or breathing requires it. If awake, encourage them to keep their head and neck in a comfortable, stable position.', 'Check breathing continuously. If normal breathing stops, start CPR; opening the airway takes priority over keeping the neck still. Follow the 999 operator.', 'Control any life-threatening bleeding without unnecessary movement.'],
    },
    crush_injury: {
      eyebrow:'CRUSH / ENTRAPMENT', title:'ISOLATE HAZARD. CALL 999.', tone:'danger', call:true,
      steps:['Make sure machinery, loads and moving equipment are isolated before approaching. Do not enter under an unstable load.', 'Call 999 for a serious crush injury or entrapment.', 'Do not attempt a dangerous release of a trapped person. Follow the emergency operator and site rescue instructions.', 'When it is safe to reach them, minimise neck and spine movement, check response and breathing, and start CPR if they are not breathing normally.', 'Control life-threatening bleeding with direct pressure and a tourniquet for severe arm or leg bleeding if needed.'],
    },
    electrical_injury: {
      eyebrow:'ELECTRICAL INJURY', title:'POWER OFF. CALL 999.', tone:'danger', call:true,
      steps:['Do not touch the casualty while they are still in contact with electricity. Isolate the supply or use the emergency stop if it is safe to do so.', 'For high voltage, or if you cannot confirm the supply is isolated, keep clear and call 999/112 and the site electrical rescue or competent person.', 'Once the electrical source is confirmed isolated, check response and breathing. Start CPR and use an AED if they are not breathing normally.', 'After immediate life threats are managed, cool visible burns with cool or lukewarm running water for 20 minutes. Do not use ice or creams.'],
    },
    thermal_burn: {
      eyebrow:'SERIOUS BURN', title:'COOL 20 MINUTES.', tone:'danger', call:true,
      steps:['Stop the burning process and move away from the heat source if it is safe.', 'Cool the burn under cool or lukewarm running water for 20 minutes as soon as possible.', 'Remove clothing or jewellery near the burn, but do not remove anything stuck to the skin.', 'After cooling, lay cling film loosely over the burn if available. Do not wrap it around a limb. Do not use ice, creams, oils or butter.', 'Call 999 for a large or deep burn, burns to the face or genitals, breathing difficulty, or a major fire injury.'],
    },
    chemical_burn: {
      eyebrow:'CHEMICAL BURN', title:'CALL 999. FLUSH WITH WATER.', tone:'danger', call:true,
      steps:['Call 999 for an acid or chemical burn to the skin or eyes.', 'Protect yourself with suitable gloves or PPE. Remove contaminated clothing if it is safe and carefully brush dry chemicals off the skin.', 'Flush the affected area with lots of cool or lukewarm running water for about 1 hour.', 'Do not apply creams or try to neutralise the chemical with another chemical.', 'Tell the operator what chemical was involved. Keep the product label or safety information available if this can be done safely.'],
    },
    amputation: {
      eyebrow:'AMPUTATION / SEVERED PART', title:'CONTROL BLEEDING. CALL 999.', tone:'danger', call:true,
      steps:['Call 999 and control life-threatening bleeding first with firm direct pressure.', 'For life-threatening arm or leg bleeding not controlled by pressure, apply a commercial tourniquet 5–7 cm above the wound, not over a joint. Tighten until bleeding stops, note the time, and do not release it.', 'Retrieve the amputated part once the scene is safe. Wrap it in a sterile dressing or clean cloth moistened with saline or water.', 'Place the wrapped part in a clean watertight bag or container, then place that inside another bag with ice or ice water. Do not let the body part touch ice directly and do not freeze it.', 'Keep the part with the injured person and send it to the same hospital. Label the container with the person’s name and storage time if possible.'],
    },
    operator: {
      eyebrow:'NOT SURE WHAT IS HAPPENING', title:'CALL 999 / 112 FOR GUIDANCE', tone:'ready', call:true,
      steps:['If you are worried the situation may be life-threatening, call 999 or 112.', 'Put the phone on speaker and describe what you can see.', 'Follow the emergency operator instructions. Operator instructions always override this app.'],
    },
  },
};

const cpr = {
  adult: {
    eyebrow:'ADULT CPR', title:'CALL 999. START CPR.', tone:'danger', call:true, rhythm:true,
    steps:['Call 999 or 112 on speaker. If the person is unresponsive and not breathing normally, start CPR.', 'Place the heel of one hand in the centre of the chest, the other hand on top, arms straight.', 'Compress 5–6 cm deep at 100–120 compressions per minute. Allow full chest recoil and minimise pauses.', 'If trained and willing, give 30 compressions then 2 breaths. If not, continue chest-compression-only CPR.', 'Use an AED as soon as it arrives. Switch it on and follow its prompts.'],
  },
  child: {
    eyebrow:'CHILD CPR — 1 TO 18', title:'CALL 999. GIVE 5 BREATHS.', tone:'danger', call:true, rhythm:true,
    steps:['Call 999 on speaker and say you are with an unresponsive child who is not breathing normally.', 'If able, give 5 initial rescue breaths.', 'Compress the centre/lower half of the chest with one or two hands, about one third of chest depth (about 5 cm), at 100–120 per minute.', 'For a lay rescuer, continue 30 compressions then 2 breaths. Follow the 999 operator; if specifically trained in paediatric BLS, use your training.', 'Use an AED as soon as available and follow its prompts.'],
  },
  infant: {
    eyebrow:'BABY CPR — UNDER 1', title:'CALL 999. GIVE 5 BREATHS.', tone:'danger', call:true, rhythm:true,
    steps:['Call 999 on speaker and say you are with an unresponsive baby who is not breathing normally.', 'Give 5 initial rescue breaths if able, covering the baby’s mouth and nose to make a seal.', 'Use the two-thumb encircling technique where possible. Compress the lower half of the breastbone about one third of chest depth (about 4 cm) at 100–120 per minute.', 'Continue 30 compressions then 2 breaths as a lay rescuer and follow the 999 operator.', 'Use an AED as soon as available and follow its prompts.'],
  },
};

const choking = {
  adult: {
    eyebrow:'CHOKING — ADULT', title:'CAN THEY COUGH?', tone:'danger', call:false,
    steps:['If they can cough effectively, encourage coughing and watch closely.', 'If the cough is ineffective, give up to 5 firm back blows between the shoulder blades, checking after each one.', 'If still choking, give up to 5 abdominal thrusts. Alternate 5 back blows and 5 abdominal thrusts.', 'If they become unresponsive, call 999/112 and start CPR. Do not perform a blind finger sweep.'],
  },
  child: {
    eyebrow:'CHOKING — CHILD OVER 1', title:'COUGH • BACK BLOWS • THRUSTS', tone:'danger', call:false,
    steps:['If the child can cough effectively, encourage coughing.', 'If the cough is ineffective, give up to 5 back blows, checking after each.', 'If still choking, give up to 5 abdominal thrusts. Alternate back blows and abdominal thrusts.', 'If the child becomes unresponsive, call 999/112 and start CPR. Do not perform a blind finger sweep.'],
  },
  infant: {
    eyebrow:'CHOKING — BABY UNDER 1', title:'BACK BLOWS • CHEST THRUSTS', tone:'danger', call:false,
    steps:['Support the baby with the head lower than the chest and give up to 5 back blows between the shoulder blades.', 'If the blockage remains, turn the baby face-up while supporting the head and give up to 5 chest thrusts.', 'Repeat cycles of 5 back blows and 5 chest thrusts. Do not use abdominal thrusts on a baby.', 'If the baby becomes unresponsive, call 999/112 and start baby CPR. Remove only clearly visible objects; never sweep blindly with a finger.'],
  },
};

export function createIncident(now = new Date().toISOString()) {
  return {
    state: IncidentState.ASSESSING,
    activatedAt: now,
    updatedAt: now,
    currentQuestion: Question.SCENE_SAFE,
    answers: {},
    scenario: null,
    ageGroup: null,
    callNumber: null,
    callState: 'NOT_STARTED',
    location: { status:'IDLE', latitude:null, longitude:null, accuracyMetres:null },
  };
}

function guidance(incident, scenario, ageGroup = null, now) {
  return { ...incident, state:IncidentState.GUIDANCE, currentQuestion:null, scenario, ageGroup, updatedAt:now };
}

export function reduceIncident(incident, action, now = new Date().toISOString()) {
  if (!incident) throw new Error('An incident is required');
  switch (action.type) {
    case 'ANSWER': return answerQuestion(incident, action.answer, now);
    case 'SELECT_SCENARIO': {
      const scenario = action.scenario;
      const allowed = [
        Scenario.CPR, Scenario.SEVERE_BLEEDING, Scenario.CHOKING, Scenario.STROKE, Scenario.ANAPHYLAXIS,
        Scenario.FALL_HEAD_SPINE, Scenario.CRUSH_INJURY, Scenario.ELECTRICAL_INJURY, Scenario.THERMAL_BURN,
        Scenario.CHEMICAL_BURN, Scenario.AMPUTATION, Scenario.OPERATOR,
      ];
      if (!allowed.includes(scenario)) return incident;
      if (scenario === Scenario.CPR || scenario === Scenario.CHOKING) return guidance(incident, scenario, AgeGroup.ADULT, now);
      return guidance(incident, scenario, null, now);
    }
    case 'SELECT_AGE': {
      if (!Object.values(AgeGroup).includes(action.ageGroup)) return incident;
      if (![Scenario.CPR,Scenario.CHOKING].includes(incident.scenario)) return incident;
      return guidance(incident, incident.scenario, action.ageGroup, now);
    }
    case 'BACK_TO_SCENARIOS': return { ...incident, state:IncidentState.SCENARIO_PICKER, currentQuestion:null, scenario:null, ageGroup:null, updatedAt:now };
    case 'CALL_DIALER_OPENED': return { ...incident, callNumber:action.number, callState:'DIALER_OPENED_CONNECTION_UNKNOWN', updatedAt:now };
    case 'LOCATION_REQUESTING': return { ...incident, location:{...incident.location,status:'REQUESTING'}, updatedAt:now };
    case 'LOCATION_AVAILABLE': return { ...incident, location:{status:'AVAILABLE',latitude:action.latitude,longitude:action.longitude,accuracyMetres:action.accuracyMetres}, updatedAt:now };
    case 'LOCATION_FAILED': return { ...incident, location:{status:action.status || 'UNAVAILABLE',latitude:null,longitude:null,accuracyMetres:null}, updatedAt:now };
    case 'CANCEL': return { ...incident, state:IncidentState.CANCELLED, updatedAt:now };
    default: return incident;
  }
}

function answerQuestion(incident, answer, now) {
  if (!Object.values(Answer).includes(answer)) throw new Error(`Unsupported answer: ${answer}`);
  const question = incident.currentQuestion;
  if (!question) return incident;
  const answers = { ...incident.answers, [question]:answer };
  if (question === Question.SCENE_SAFE) {
    if (answer === Answer.YES) return { ...incident, answers, currentQuestion:Question.RESPONSIVE, updatedAt:now };
    return guidance({ ...incident, answers }, Scenario.SCENE_UNSAFE, null, now);
  }
  if (question === Question.RESPONSIVE) {
    if (answer === Answer.YES) return { ...incident, answers, currentQuestion:Question.SEVERE_BLEEDING, updatedAt:now };
    return { ...incident, answers, currentQuestion:Question.BREATHING, updatedAt:now };
  }
  if (question === Question.BREATHING) {
    if (answer === Answer.YES) return guidance({ ...incident, answers }, Scenario.UNCONSCIOUS_BREATHING, null, now);
    return guidance({ ...incident, answers }, Scenario.CPR, AgeGroup.ADULT, now);
  }
  if (question === Question.SEVERE_BLEEDING) {
    if (answer === Answer.YES) return guidance({ ...incident, answers }, Scenario.SEVERE_BLEEDING, null, now);
    return { ...incident, answers, state:IncidentState.SCENARIO_PICKER, currentQuestion:null, scenario:null, ageGroup:null, updatedAt:now };
  }
  return incident;
}

export function getQuestionCopy(question) { return copy.questions[question] || null; }

export function getScenarioCopy(scenario, ageGroup = null) {
  if (scenario === Scenario.CPR) return cpr[ageGroup] || null;
  if (scenario === Scenario.CHOKING) return choking[ageGroup] || null;
  return copy.scenarios[scenario] || null;
}
