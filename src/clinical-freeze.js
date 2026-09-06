import { scenarioSources, sources } from './source-provenance.js';

export const CLINICAL_FREEZE_REVISION='CF-2026-09-06-01';
export const CLINICAL_FREEZE_DATE='2026-09-06';
export const RELEASE_STATUS='ENGINEERING_RC';
export const MEDICAL_COPY_STATUS='FROZEN_PENDING_INDEPENDENT_REVIEW';

export const RELEASE_GATES=Object.freeze({
  real_device_acceptance:Object.freeze({status:'PENDING',requiredForPilot:true}),
  independent_clinical_review:Object.freeze({status:'PENDING',requiredForPilot:true}),
  human_translation_review:Object.freeze({status:'PENDING',requiredForPilot:true}),
  product_safety_legal_review:Object.freeze({status:'PENDING',requiredForPilot:true}),
});

export const LIVE_RUNTIME_SCENARIOS=Object.freeze([
  'scene_unsafe','unconscious_breathing','cpr','severe_bleeding','choking','stroke','anaphylaxis',
  'fall_head_spine','crush_injury','electrical_injury','thermal_burn','chemical_burn','amputation','operator',
  'open_chest_wound','fracture_dislocation','eye_injury','fume_inhalation','heat_illness','hypothermia','seizure','hypoglycaemia',
]);

// Git blob fingerprints intentionally pin the medical copy reviewed for this freeze.
// Any change to these files must create a new clinical freeze revision and pass review again.
export const MEDICAL_COPY_BLOBS=Object.freeze({
  'src/emergency-state.js':'667966a95bcf513ce3f0e6324b022a215502b31d',
  'src/site-medical-ui.js':'3be567397f1e7e7a82a3276f322a37ffcff061fc',
});

export const TRANSLATION_PACK_BLOBS=Object.freeze({
  ar:'b027c70f3229928d748626b1c3d648fba3260160',
  bg:'32aa88ad494092ec873a691dbb9d9fc0d9a1cf86',
  bn:'96de6c711c933695af29fe201e586257bccb71b2',
  en:'6d01270e11e180706539a8de5a512afcdd5a9d3f',
  es:'e2645a484e33ea40178c8c94033a87357500a042',
  fr:'d5fe136ee951f9e36d43dfcd12a8ae829d1229a6',
  gu:'e884829f9330b324bae4e2cec75fcceb839e70bf',
  it:'19bd0c4f8741b161330e13f5b9d4b1f85d259630',
  lt:'2997e628da2637bb5719d2ed59412c4d988e9c0d',
  pa:'aad7d53759f5a8cf4899d96e3bac5afd83ec7cf1',
  pl:'985cd4d55fc1d7801f33fb090537c2d0d3c164b2',
  pt:'d5618484cc440a7c446dc46dd8c04f036cba01bc',
  ro:'2c828102e11ce00e4a4474adeb7fb6184bddb70c',
  tr:'08bd6529dd60ee747d0a24975c741273ee9418d8',
  uk:'823c66231fa6afeed2116c6f2fe384891803e2e1',
  ur:'d167526178decdebdf15e30aa8856990993cab0d',
  zh:'de275a9bde1d0a6099d2859135c8c7b42df7df1b',
});

export const TRANSLATION_REVIEW_STATUS=Object.freeze(Object.fromEntries(
  Object.keys(TRANSLATION_PACK_BLOBS).map((code)=>[code,code==='en'?'SOURCE_LANGUAGE':'HUMAN_REVIEW_REQUIRED'])
));

export function getMissingSourceCoverage(){
  return LIVE_RUNTIME_SCENARIOS.filter((scenario)=>{
    const ids=scenarioSources[scenario];
    return !Array.isArray(ids)||ids.length===0||ids.some((id)=>!sources[id]?.url);
  });
}

export function isPilotReleaseAllowed(){
  return Object.values(RELEASE_GATES).every((gate)=>!gate.requiredForPilot||gate.status==='PASS');
}

export function getReleaseGateSummary(){
  return Object.freeze({
    revision:CLINICAL_FREEZE_REVISION,
    status:RELEASE_STATUS,
    medicalCopy:MEDICAL_COPY_STATUS,
    pilotReleaseAllowed:isPilotReleaseAllowed(),
    missingSourceCoverage:getMissingSourceCoverage(),
    gates:RELEASE_GATES,
  });
}
