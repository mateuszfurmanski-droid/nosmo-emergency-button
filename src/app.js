import {
  Answer,
  Guidance,
  IncidentState,
  createIncident,
  getGuidanceCopy,
  getQuestionCopy,
  getResponderSummary,
  reduceIncident,
} from "./emergency-state.js";

const refs = {
  startScreen: document.querySelector("#startScreen"),
  emergencyScreen: document.querySelector("#emergencyScreen"),
  activateButton: document.querySelector("#activateButton"),
  elapsedTime: document.querySelector("#elapsedTime"),
  voiceToggle: document.querySelector("#voiceToggle"),
  teamStatus: document.querySelector("#teamStatus"),
  teamStatusValue: document.querySelector("#teamStatusValue"),
  teamStatusDetail: document.querySelector("#teamStatusDetail"),
  locationStatusValue: document.querySelector("#locationStatusValue"),
  locationStatusDetail: document.querySelector("#locationStatusDetail"),
  microphoneStatusValue: document.querySelector("#microphoneStatusValue"),
  microphoneStatusDetail: document.querySelector("#microphoneStatusDetail"),
  micMeterFill: document.querySelector("#micMeterFill"),
  decisionPanel: document.querySelector("#decisionPanel"),
  cancelButton: document.querySelector("#cancelButton"),
  responderDialog: document.querySelector("#responderDialog"),
  responderList: document.querySelector("#responderList"),
  acknowledgeDemo: document.querySelector("#acknowledgeDemo"),
  unavailableDemo: document.querySelector("#unavailableDemo"),
  joinAudioDemo: document.querySelector("#joinAudioDemo"),
  closeResponderDialog: document.querySelector("#closeResponderDialog"),
  toast: document.querySelector("#toast"),
};

let incident = null;
let voiceEnabled = true;
let lastSpokenKey = null;
let elapsedTimer = null;
let responderTimers = [];
let toastTimer = null;
let mediaStream = null;
let audioContext = null;
let analyser = null;
let levelFrame = null;
let wakeLock = null;
let recognition = null;
let recognitionActive = false;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function now() { return new Date().toISOString(); }

function dispatch(action) {
  if (!incident) return;
  incident = reduceIncident(incident, action, now());
  render();
}

function activateDemo() {
  if (incident) return;
  incident = createIncident(now());
  refs.startScreen.hidden = true;
  refs.emergencyScreen.hidden = false;
  document.body.classList.add("emergency-active");
  render();
  dispatch({ type: "BEGIN_ASSESSMENT" });
  startElapsedTimer();
  startResponderSimulation();
  requestDeviceFullscreen();
  requestWakeLock();
  requestLocation();
  requestLocalMicrophone();
}

async function requestDeviceFullscreen() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen({ navigationUI: "hide" });
  } catch { showToast("FULLSCREEN API UNAVAILABLE • VIEWPORT MODE IS STILL ACTIVE"); }
}

async function requestWakeLock() {
  try { if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen"); } catch { wakeLock = null; }
}

function requestLocation() {
  if (!("geolocation" in navigator)) { dispatch({ type: "LOCATION_FAILED", status: "UNAVAILABLE" }); return; }
  navigator.geolocation.getCurrentPosition(
    (position) => dispatch({ type: "LOCATION_AVAILABLE", latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMetres: position.coords.accuracy }),
    (error) => dispatch({ type: "LOCATION_FAILED", status: error.code === error.PERMISSION_DENIED ? "DENIED" : "UNAVAILABLE" }),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
  );
}

async function requestLocalMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) { dispatch({ type: "MICROPHONE_FAILED", status: "UNAVAILABLE" }); return; }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { autoGainControl: true, echoCancellation: true, noiseSuppression: true }, video: false });
    dispatch({ type: "MICROPHONE_ACTIVE" });
    startLocalLevelMeter(mediaStream);
  } catch (error) {
    dispatch({ type: "MICROPHONE_FAILED", status: error?.name === "NotAllowedError" ? "DENIED" : "UNAVAILABLE" });
  }
}

function startLocalLevelMeter(stream) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    const update = () => {
      if (!analyser || !mediaStream) return;
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) { const normal = (sample - 128) / 128; sum += normal * normal; }
      const level = Math.min(100, Math.round(Math.sqrt(sum / samples.length) * 260));
      refs.micMeterFill.style.width = `${Math.max(3, level)}%`;
      levelFrame = window.requestAnimationFrame(update);
    };
    update();
  } catch { refs.micMeterFill.style.width = "12%"; }
}

function startResponderSimulation() {
  const schedule = [
    [550, "demo-first-aider-1", "DELIVERED", null],
    [1000, "demo-first-aider-1", "ACKNOWLEDGED", null],
    [1500, "demo-supervisor-1", "ACKNOWLEDGED", null],
    [2100, "demo-first-aider-1", "EN_ROUTE", 2],
    [2700, "demo-gate-1", "ACKNOWLEDGED", null],
    [3300, "demo-supervisor-1", "EN_ROUTE", 3],
  ];
  responderTimers = schedule.map(([delay, id, state, etaMinutes]) => window.setTimeout(() => dispatch({ type: "RESPONDER_UPDATE", id, state, etaMinutes }), delay));
}

function startElapsedTimer() { updateElapsed(); elapsedTimer = window.setInterval(updateElapsed, 1000); }
function updateElapsed() {
  if (!incident) return;
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(incident.activatedAt)) / 1000));
  const minutes = Math.floor(seconds / 60); const remainder = seconds % 60;
  refs.elapsedTime.textContent = `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  refs.elapsedTime.dateTime = `PT${seconds}S`;
}

function render() {
  if (!incident) return;
  renderStatus(); renderResponderList();
  if (incident.state === IncidentState.CANCELLED_FALSE_ALARM) return renderCancelled();
  if (incident.state === IncidentState.ACTIVATED) {
    refs.decisionPanel.innerHTML = `<div class="activating-view"><p class="eyebrow danger-text">LOCAL EMERGENCY MODE STARTED</p><h2>STARTING HELP FLOW</h2><p>Location, microphone and simulated responder actions are beginning in parallel.</p></div>`;
    speakOnce("activated", "Emergency mode active. This is a demonstration. Is the area safe to enter?");
    return;
  }
  if (incident.state === IncidentState.ASSESSING) return renderQuestion();
  if (incident.state === IncidentState.GUIDANCE) return renderGuidance();
  if (incident.state === IncidentState.HANDOVER_READY) renderHandover();
}

function renderStatus() {
  const summary = getResponderSummary(incident.responders);
  refs.teamStatusValue.textContent = summary.onScene ? `${summary.onScene} ON SCENE` : summary.enRoute ? `${summary.enRoute} EN ROUTE` : summary.acknowledged ? `${summary.acknowledged} ACKNOWLEDGED` : "ALERTING DEMO";
  refs.teamStatusDetail.textContent = `${summary.acknowledged} OF ${summary.total} ACK • SIMULATED`;
  const location = incident.location;
  if (location.status === "AVAILABLE") {
    refs.locationStatusValue.textContent = `GPS ±${Math.round(location.accuracyMetres)}M`;
    refs.locationStatusDetail.textContent = `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)} • DEVICE ONLY`;
  } else if (location.status === "REQUESTING") {
    refs.locationStatusValue.textContent = "REQUESTING"; refs.locationStatusDetail.textContent = "DEMO SITE • LEEDS";
  } else {
    refs.locationStatusValue.textContent = `GPS ${location.status}`; refs.locationStatusDetail.textContent = "FALLBACK • LEVEL 3 • ZONE C";
  }
  const microphone = incident.microphone;
  if (microphone.status === "LOCAL_ACTIVE") { refs.microphoneStatusValue.textContent = "LOCAL MIC ACTIVE"; refs.microphoneStatusDetail.textContent = "NOT SENT • NOT RECORDED"; }
  else if (microphone.status === "REQUESTING") { refs.microphoneStatusValue.textContent = "REQUESTING"; refs.microphoneStatusDetail.textContent = "LOCAL PERMISSION"; }
  else { refs.microphoneStatusValue.textContent = `MIC ${microphone.status}`; refs.microphoneStatusDetail.textContent = "FLOW CONTINUES"; refs.micMeterFill.style.width = "0%"; }
}

function renderQuestion() {
  const copy = getQuestionCopy(incident.triage.currentQuestion); if (!copy) return;
  const voiceUnavailable = !SpeechRecognition;
  refs.decisionPanel.innerHTML = `<div class="question-view"><div class="instruction-copy"><p class="eyebrow">${copy.eyebrow}</p><h2>${copy.title}</h2><p>${copy.detail}</p></div><div class="answer-grid" aria-label="Answer choices"><button class="answer-button answer-yes" type="button" data-answer="YES">YES</button><button class="answer-button answer-no" type="button" data-answer="NO">NO</button><button class="answer-button answer-unknown" type="button" data-answer="UNKNOWN">NOT SURE</button><button class="answer-button answer-voice" type="button" data-voice-answer ${voiceUnavailable ? "disabled" : ""}>${voiceUnavailable ? "VOICE OFF" : recognitionActive ? "LISTENING" : "SPEAK"}<span>${voiceUnavailable ? "NOT SUPPORTED" : "SAY YES, NO OR NOT SURE"}</span></button></div></div>`;
  refs.decisionPanel.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => answer(button.dataset.answer, "touch")));
  refs.decisionPanel.querySelector("[data-voice-answer]")?.addEventListener("click", startVoiceAnswer);
  speakOnce(incident.triage.currentQuestion, `${copy.title} ${copy.detail}`);
}

function renderGuidance() {
  const guidance = getGuidanceCopy(incident.triage.guidance); if (!guidance) return;
  refs.decisionPanel.innerHTML = `<div class="guidance-view"><div class="guidance-copy ${guidance.tone}"><p class="eyebrow">${guidance.eyebrow}</p><h2>${guidance.title}</h2><p>${guidance.action}</p><p class="guidance-secondary">${guidance.secondary}</p></div><div class="guidance-actions"><button class="call-action primary-call" type="button" data-call="999">CALL 999<span>OPENS DIALLER</span></button><button class="call-action" type="button" data-call="112">CALL 112<span>OPENS DIALLER</span></button><button class="next-action" type="button" data-handover>HANDOVER<span>SHOW THE PREPARED BRIEF</span></button><button class="next-action" type="button" data-repeat>READ AGAIN<span>VOICE GUIDANCE</span></button></div></div>`;
  refs.decisionPanel.querySelectorAll("[data-call]").forEach((button) => button.addEventListener("click", () => openDialler(button.dataset.call)));
  refs.decisionPanel.querySelector("[data-handover]")?.addEventListener("click", () => dispatch({ type: "HANDOVER_READY" }));
  refs.decisionPanel.querySelector("[data-repeat]")?.addEventListener("click", () => speak(`${guidance.title}. ${guidance.action}. ${guidance.secondary}`));
  speakOnce(incident.triage.guidance, `${guidance.title}. ${guidance.action}. ${guidance.secondary}`);
}

function renderHandover() {
  const answers = incident.triage.answers; const value = (id) => answers[id]?.answer || "NOT ASKED";
  const location = incident.location.status === "AVAILABLE" ? `GPS ±${Math.round(incident.location.accuracyMetres)}M` : "LEVEL 3 • ZONE C • VERIFY";
  refs.decisionPanel.innerHTML = `<div class="handover-view"><p class="eyebrow">DEMO OPERATOR BRIEF • CHECK BEFORE SPEAKING</p><h2>HANDOVER READY</h2><div class="handover-grid"><div class="handover-item"><span>LOCATION</span><strong>${location}</strong></div><div class="handover-item"><span>SCENE SAFE</span><strong>${value("scene_safe")}</strong></div><div class="handover-item"><span>RESPONSIVE</span><strong>${value("responsive")}</strong></div><div class="handover-item"><span>BREATHING</span><strong>${value("breathing")}</strong></div><div class="handover-item"><span>SEVERE BLEEDING</span><strong>${value("severe_bleeding")}</strong></div><div class="handover-item"><span>TEAM RESPONSE</span><strong>${getResponderSummary(incident.responders).acknowledged} ACK • DEMO</strong></div></div><p>Read this to the operator. Do not play it automatically. Operator instructions always override the module.</p><div class="guidance-actions"><button class="call-action primary-call" type="button" data-call="999">CALL 999<span>OPENS DIALLER</span></button><button class="call-action" type="button" data-call="112">CALL 112<span>OPENS DIALLER</span></button></div></div>`;
  refs.decisionPanel.querySelectorAll("[data-call]").forEach((button) => button.addEventListener("click", () => openDialler(button.dataset.call)));
  speakOnce("handover", "Handover ready. Check the information and read it to the emergency operator.");
}

function renderCancelled() {
  refs.cancelButton.hidden = true;
  refs.decisionPanel.innerHTML = `<div class="cancelled-view"><p class="eyebrow danger-text">FALSE ALARM • LOCAL DEMO ONLY</p><h2>DEMO CANCELLED</h2><p>No real responders were alerted. No external cancellation was sent. Local microphone tracks have been stopped.</p><button class="reset-action" type="button" data-reset>RESET DEMO</button></div>`;
  refs.decisionPanel.querySelector("[data-reset]")?.addEventListener("click", resetDemo);
}

function renderResponderList() {
  refs.responderList.innerHTML = incident.responders.map((responder) => `<div class="responder-row"><div><strong>${responder.syntheticName}</strong><span>${responder.role} • SYNTHETIC</span></div><span class="responder-state">${responder.state}${responder.etaMinutes ? ` • ${responder.etaMinutes} MIN` : ""}</span></div>`).join("");
}

function answer(rawAnswer, source) { const answerValue = Answer[rawAnswer]; if (!answerValue) return; dispatch({ type: "ANSWER", answer: answerValue, source }); }

function startVoiceAnswer() {
  if (!SpeechRecognition || recognitionActive) return;
  recognition = new SpeechRecognition(); recognition.lang = navigator.language || "en-GB"; recognition.interimResults = false; recognition.maxAlternatives = 1; recognition.continuous = false; recognitionActive = true; renderQuestion();
  recognition.addEventListener("result", (event) => {
    const words = String(event.results?.[0]?.[0]?.transcript || "").toLowerCase().trim(); recognitionActive = false;
    const unknownWords = ["not sure", "unknown", "don't know", "do not know", "nie wiem"]; const noWords = ["no", "unsafe", "not safe", "nie"]; const yesWords = ["yes", "safe", "tak"];
    if (unknownWords.some((phrase) => words.includes(phrase))) answer("UNKNOWN", "voice");
    else if (noWords.some((phrase) => words === phrase || words.includes(`${phrase} `))) answer("NO", "voice");
    else if (yesWords.some((phrase) => words === phrase || words.includes(`${phrase} `))) answer("YES", "voice");
    else { showToast("VOICE ANSWER NOT UNDERSTOOD • USE A LARGE BUTTON"); renderQuestion(); }
  });
  recognition.addEventListener("error", () => { recognitionActive = false; showToast("VOICE INPUT UNAVAILABLE • USE A LARGE BUTTON"); renderQuestion(); });
  recognition.addEventListener("end", () => { if (recognitionActive) { recognitionActive = false; renderQuestion(); } });
  try { recognition.start(); } catch { recognitionActive = false; showToast("VOICE INPUT UNAVAILABLE • USE A LARGE BUTTON"); renderQuestion(); }
}

function openDialler(number) { dispatch({ type: "CALL_DIALER_OPENED", number }); showToast(`OPENING ${number} DIALLER • CONNECTION NOT CONFIRMED`); window.location.href = `tel:${number}`; }
function toggleVoice() { voiceEnabled = !voiceEnabled; refs.voiceToggle.textContent = voiceEnabled ? "VOICE ON" : "VOICE OFF"; refs.voiceToggle.setAttribute("aria-pressed", String(voiceEnabled)); if (!voiceEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel(); if (voiceEnabled) { lastSpokenKey = null; render(); } }
function speakOnce(key, words) { if (!voiceEnabled || key === lastSpokenKey) return; lastSpokenKey = key; speak(words); }
function speak(words) { if (!voiceEnabled || !("speechSynthesis" in window)) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(words); utterance.lang = "en-GB"; utterance.rate = 0.92; utterance.pitch = 1; window.speechSynthesis.speak(utterance); }

function cancelDemo() { cleanupLiveResources(); dispatch({ type: "CANCEL" }); if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); }
function resetDemo() { cleanupLiveResources(); incident = null; lastSpokenKey = null; refs.cancelButton.hidden = false; refs.emergencyScreen.hidden = true; refs.startScreen.hidden = false; refs.elapsedTime.textContent = "00:00"; refs.micMeterFill.style.width = "0%"; document.body.classList.remove("emergency-active"); refs.activateButton.focus(); }

function cleanupLiveResources() {
  responderTimers.forEach((timer) => window.clearTimeout(timer)); responderTimers = [];
  if (elapsedTimer) window.clearInterval(elapsedTimer); elapsedTimer = null;
  if (levelFrame) window.cancelAnimationFrame(levelFrame); levelFrame = null;
  mediaStream?.getTracks().forEach((track) => track.stop()); mediaStream = null;
  analyser?.disconnect(); analyser = null; audioContext?.close().catch(() => {}); audioContext = null;
  recognition?.abort(); recognition = null; recognitionActive = false;
  if (wakeLock) wakeLock.release().catch(() => {}); wakeLock = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function showToast(message) { refs.toast.textContent = message; refs.toast.hidden = false; if (toastTimer) window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { refs.toast.hidden = true; }, 3200); }
function openResponders() { renderResponderList(); if (typeof refs.responderDialog.showModal === "function") refs.responderDialog.showModal(); else refs.responderDialog.setAttribute("open", ""); }
function closeResponders() { if (typeof refs.responderDialog.close === "function") refs.responderDialog.close(); else refs.responderDialog.removeAttribute("open"); }

refs.activateButton.addEventListener("click", activateDemo);
refs.voiceToggle.addEventListener("click", toggleVoice);
refs.cancelButton.addEventListener("click", cancelDemo);
refs.teamStatus.addEventListener("click", openResponders);
refs.closeResponderDialog.addEventListener("click", closeResponders);
refs.acknowledgeDemo.addEventListener("click", () => { dispatch({ type: "RESPONDER_UPDATE", id: "demo-first-aider-1", state: "EN_ROUTE", etaMinutes: 2 }); showToast("SIMULATED FIRST AIDER EN ROUTE • 2 MIN"); closeResponders(); });
refs.unavailableDemo.addEventListener("click", () => { dispatch({ type: "RESPONDER_UPDATE", id: "demo-first-aider-1", state: "UNAVAILABLE" }); showToast("SIMULATED RESPONDER UNAVAILABLE • ESCALATION WOULD CONTINUE"); closeResponders(); });
refs.joinAudioDemo.addEventListener("click", () => showToast("LIVE AUDIO NEEDS THE FUTURE SECURE BACKEND • NOT CONNECTED"));

window.addEventListener("beforeunload", cleanupLiveResources);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && incident && !wakeLock) requestWakeLock(); });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
