export const IncidentState = Object.freeze({
  IDLE: "IDLE",
  ACTIVATED: "ACTIVATED",
  ASSESSING: "ASSESSING",
  GUIDANCE: "GUIDANCE",
  HANDOVER_READY: "HANDOVER_READY",
  CANCELLED_FALSE_ALARM: "CANCELLED_FALSE_ALARM",
});

export const Answer = Object.freeze({
  YES: "YES",
  NO: "NO",
  UNKNOWN: "UNKNOWN",
});

export const Question = Object.freeze({
  SCENE_SAFE: "scene_safe",
  RESPONSIVE: "responsive",
  BREATHING: "breathing",
  SEVERE_BLEEDING: "severe_bleeding",
});

export const Guidance = Object.freeze({
  SCENE_UNSAFE: "scene_unsafe",
  CPR: "cpr",
  SEVERE_BLEEDING: "severe_bleeding",
  OPERATOR_BRIEF: "operator_brief",
});

export const demoResponders = Object.freeze([
  Object.freeze({ id: "demo-first-aider-1", syntheticName: "SAM LEE", role: "FIRST AIDER", state: "ALERTING", etaMinutes: null, synthetic: true }),
  Object.freeze({ id: "demo-supervisor-1", syntheticName: "ALEX CARTER", role: "SUPERVISOR", state: "ALERTING", etaMinutes: null, synthetic: true }),
  Object.freeze({ id: "demo-gate-1", syntheticName: "JORDAN KIM", role: "GATE / SECURITY", state: "ALERTING", etaMinutes: null, synthetic: true }),
]);

function event(type, label, occurredAt, capability = "LOCAL", status = "CONFIRMED") {
  return { id: `${type}-${occurredAt}-${label}`, type, label, occurredAt, capability, status };
}

function append(incident, next, timelineEvent, now) {
  return { ...incident, ...next, updatedAt: now, timeline: timelineEvent ? [...incident.timeline, timelineEvent] : incident.timeline };
}

export function createIncident(now = new Date().toISOString()) {
  return {
    id: `DEMO-${now.replace(/[^0-9]/g, "").slice(0, 14)}`,
    mode: "DEMO",
    state: IncidentState.ACTIVATED,
    activatedAt: now,
    updatedAt: now,
    emergencyNumberChoice: null,
    location: { status: "REQUESTING", latitude: null, longitude: null, accuracyMetres: null, capturedAt: null, source: "configured_demo_site", isPrecise: false },
    microphone: { status: "REQUESTING", level: 0, retained: false, transmitted: false },
    responders: demoResponders.map((responder) => ({ ...responder, updatedAt: now })),
    triage: { currentQuestion: Question.SCENE_SAFE, answers: {}, guidance: null },
    timeline: [
      event("ACTIVATED", "Local demo emergency activated", now, "LOCAL", "CONFIRMED"),
      event("ALERT_SIMULATION", "Synthetic responder fan-out started", now, "SIMULATED", "PENDING"),
    ],
  };
}

export function reduceIncident(incident, action, now = new Date().toISOString()) {
  if (!incident) throw new Error("An incident is required");
  switch (action.type) {
    case "BEGIN_ASSESSMENT":
      return append(incident, { state: IncidentState.ASSESSING }, event("ASSESSMENT_STARTED", "Scene assessment started", now), now);
    case "LOCATION_AVAILABLE":
      return append(incident, { location: { status: "AVAILABLE", latitude: action.latitude, longitude: action.longitude, accuracyMetres: action.accuracyMetres, capturedAt: now, source: "browser_geolocation", isPrecise: Number(action.accuracyMetres) <= 30 } }, event("LOCATION_AVAILABLE", "Location available on this device only", now), now);
    case "LOCATION_FAILED":
      return append(incident, { location: { ...incident.location, status: action.status || "UNAVAILABLE", capturedAt: now, source: "configured_demo_site", isPrecise: false } }, event("LOCATION_FAILED", "Precise location unavailable", now, "LOCAL", "FAILED"), now);
    case "MICROPHONE_ACTIVE":
      return append(incident, { microphone: { status: "LOCAL_ACTIVE", level: 0, retained: false, transmitted: false } }, event("MICROPHONE_ACTIVE", "Local microphone active; not transmitted", now), now);
    case "MICROPHONE_LEVEL":
      return append(incident, { microphone: { ...incident.microphone, level: Math.max(0, Math.min(100, Math.round(action.level || 0))) } }, null, now);
    case "MICROPHONE_FAILED":
      return append(incident, { microphone: { status: action.status || "UNAVAILABLE", level: 0, retained: false, transmitted: false } }, event("MICROPHONE_FAILED", "Local microphone unavailable", now, "LOCAL", "FAILED"), now);
    case "MICROPHONE_STOPPED":
      return append(incident, { microphone: { status: "STOPPED", level: 0, retained: false, transmitted: false } }, event("MICROPHONE_STOPPED", "Local microphone stopped", now), now);
    case "RESPONDER_UPDATE": {
      const responders = incident.responders.map((responder) => responder.id === action.id ? { ...responder, state: action.state, etaMinutes: action.etaMinutes ?? responder.etaMinutes, updatedAt: now } : responder);
      const target = responders.find((responder) => responder.id === action.id);
      if (!target) return incident;
      return append(incident, { responders }, event("RESPONDER_UPDATE", `${target.syntheticName} — ${target.state}`, now, "SIMULATED", "CONFIRMED"), now);
    }
    case "ANSWER":
      return answerQuestion(incident, action.answer, action.source || "touch", now);
    case "CALL_DIALER_OPENED":
      return append(incident, { emergencyNumberChoice: action.number }, event("DIALER_OPENED", `Dialler opened for ${action.number}; call state unknown`, now, "PLATFORM_ACTION", "UNKNOWN"), now);
    case "HANDOVER_READY":
      return append(incident, { state: IncidentState.HANDOVER_READY }, event("HANDOVER_READY", "Demo operator brief ready", now), now);
    case "CANCEL":
      return append(incident, { state: IncidentState.CANCELLED_FALSE_ALARM, microphone: { status: "STOPPED", level: 0, retained: false, transmitted: false } }, event("CANCELLED_FALSE_ALARM", "Local demo cancelled; no external cancellation sent", now, "LOCAL", "CONFIRMED"), now);
    default:
      return incident;
  }
}

function answerQuestion(incident, answer, source, now) {
  if (!Object.values(Answer).includes(answer)) throw new Error(`Unsupported answer: ${answer}`);
  const question = incident.triage.currentQuestion;
  if (!question) return incident;
  const answers = { ...incident.triage.answers, [question]: { answer, source, answeredAt: now } };
  let currentQuestion = null;
  let guidance = null;
  let state = IncidentState.ASSESSING;
  if (question === Question.SCENE_SAFE) {
    if (answer === Answer.YES) currentQuestion = Question.RESPONSIVE; else guidance = Guidance.SCENE_UNSAFE;
  } else if (question === Question.RESPONSIVE) {
    if (answer === Answer.NO || answer === Answer.UNKNOWN) currentQuestion = Question.BREATHING; else currentQuestion = Question.SEVERE_BLEEDING;
  } else if (question === Question.BREATHING) {
    if (answer === Answer.YES) currentQuestion = Question.SEVERE_BLEEDING; else guidance = Guidance.CPR;
  } else if (question === Question.SEVERE_BLEEDING) {
    guidance = answer === Answer.YES ? Guidance.SEVERE_BLEEDING : Guidance.OPERATOR_BRIEF;
  }
  if (guidance) state = IncidentState.GUIDANCE;
  return append(incident, { state, triage: { currentQuestion, answers, guidance } }, event("TRIAGE_ANSWER", `${question}: ${answer}`, now, "LOCAL", "CONFIRMED"), now);
}

export function getResponderSummary(responders) {
  const acknowledged = responders.filter((responder) => ["ACKNOWLEDGED", "EN_ROUTE", "ON_SCENE"].includes(responder.state)).length;
  const enRoute = responders.filter((responder) => responder.state === "EN_ROUTE").length;
  const onScene = responders.filter((responder) => responder.state === "ON_SCENE").length;
  return { total: responders.length, acknowledged, enRoute, onScene };
}

export function getQuestionCopy(question) {
  const copy = {
    [Question.SCENE_SAFE]: { eyebrow: "STEP 1 — SCENE SAFETY", title: "IS THE AREA SAFE TO ENTER?", detail: "Look for traffic, electricity, fire, smoke, gas, chemicals or moving machinery." },
    [Question.RESPONSIVE]: { eyebrow: "STEP 2 — RESPONSE", title: "IS THE PERSON RESPONDING?", detail: "Speak loudly. Ask them to open their eyes. Do not shake an injured person." },
    [Question.BREATHING]: { eyebrow: "STEP 3 — BREATHING", title: "ARE THEY BREATHING NORMALLY?", detail: "Look, listen and feel. Gasping is not normal breathing." },
    [Question.SEVERE_BLEEDING]: { eyebrow: "STEP 4 — BLEEDING", title: "IS THERE SEVERE BLEEDING?", detail: "Look for blood that is flowing, pumping or soaking through clothing." },
  };
  return copy[question] || null;
}

export function getGuidanceCopy(guidance) {
  const copy = {
    [Guidance.SCENE_UNSAFE]: { tone: "danger", eyebrow: "DANGER — DO NOT ENTER", title: "KEEP YOURSELF SAFE", action: "Move other people away. Call 999 or 112. Tell the operator what the danger is.", secondary: "Do not touch the casualty until the hazard is controlled or the operator tells you it is safe." },
    [Guidance.CPR]: { tone: "danger", eyebrow: "NOT BREATHING NORMALLY", title: "CALL NOW. START CPR.", action: "Put the phone on speaker. Follow the emergency operator. Start chest compressions as directed.", secondary: "Send someone for the nearest verified AED. Continue until help takes over or the operator tells you to stop." },
    [Guidance.SEVERE_BLEEDING]: { tone: "danger", eyebrow: "SEVERE BLEEDING", title: "APPLY FIRM DIRECT PRESSURE", action: "Use a clean pad or cloth if available. Keep firm pressure on the wound and call 999 or 112.", secondary: "Follow the emergency operator. This demo content requires final clinical approval before production use." },
    [Guidance.OPERATOR_BRIEF]: { tone: "ready", eyebrow: "INITIAL CHECK COMPLETE", title: "KEEP WATCHING THE CASUALTY", action: "Call emergency services if needed. Keep them still, warm and reassured. Report any change immediately.", secondary: "The module has prepared a demo handover from your answers. Emergency operator instructions always override this screen." },
  };
  return copy[guidance] || null;
}
