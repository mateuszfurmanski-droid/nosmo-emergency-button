export const SOURCE_REVIEW_DATE = '2026-09-05';

export const sources = Object.freeze({
  rcuk_adult_bls_2025: {
    authority:'Resuscitation Council UK',
    title:'Adult basic life support Guidelines — 2025',
    url:'https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines',
    published:'2025-10-27', reviewed:SOURCE_REVIEW_DATE,
  },
  rcuk_paediatric_cpr_2025: {
    authority:'Resuscitation Council UK',
    title:'How to do CPR — baby and child CPR aligned to 2025 guidance',
    url:'https://www.resus.org.uk/public-resource/how-do-cpr',
    reviewed:SOURCE_REVIEW_DATE,
  },
  rcuk_first_aid_2025: {
    authority:'Resuscitation Council UK',
    title:'First Aid Guidelines — 2025',
    url:'https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines',
    published:'2025-10-27', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_recovery_position: {
    authority:'NHS', title:'First aid — recovery position', url:'https://www.nhs.uk/conditions/first-aid/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_stroke: {
    authority:'NHS', title:'Stroke', url:'https://www.nhs.uk/conditions/stroke/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_heart_attack: {
    authority:'NHS', title:'Heart attack', url:'https://www.nhs.uk/conditions/heart-attack/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_seizure: {
    authority:'NHS', title:'What to do if someone has a seizure', url:'https://www.nhs.uk/conditions/epilepsy/what-to-do-if-someone-has-a-seizure-fit/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_burns: {
    authority:'NHS', title:'Burns and scalds', url:'https://www.nhs.uk/conditions/burns-and-scalds/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_chemical_burn: {
    authority:'NHS', title:'Acid and chemical burns', url:'https://www.nhs.uk/conditions/acid-and-chemical-burns/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_eye_injuries: {
    authority:'NHS', title:'Eye injuries', url:'https://www.nhs.uk/conditions/eye-injuries/', reviewed:'2026-09-06',
  },
  nhs_poisoning: {
    authority:'NHS', title:'Poisoning', url:'https://www.nhs.uk/conditions/poisoning/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_hypothermia: {
    authority:'NHS', title:'Hypothermia', url:'https://www.nhs.uk/conditions/hypothermia/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_heatstroke: {
    authority:'NHS', title:'Heat exhaustion and heatstroke', url:'https://www.nhs.uk/conditions/heat-exhaustion-heatstroke/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_hypoglycaemia: {
    authority:'NHS', title:'Low blood sugar (hypoglycaemia)', url:'https://www.nhs.uk/conditions/low-blood-sugar-hypoglycaemia/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_fainting: {
    authority:'NHS', title:'Fainting', url:'https://www.nhs.uk/symptoms/fainting/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_asthma: {
    authority:'NHS', title:'Asthma — how to treat an asthma attack', url:'https://www.nhs.uk/conditions/asthma/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_breathlessness: {
    authority:'NHS', title:'Shortness of breath', url:'https://www.nhs.uk/symptoms/shortness-of-breath/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_pregnancy_bleeding: {
    authority:'NHS', title:'Vaginal bleeding in pregnancy', url:'https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_under5_urgent: {
    authority:'NHS', title:'When to get urgent medical help for babies and children under 5', url:'https://www.nhs.uk/baby/health/when-to-get-urgent-medical-help-for-babies-and-children-under-5/', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_abdominal: {
    authority:'NHS', title:'Appendicitis — emergency abdominal pain warning signs', url:'https://www.nhs.uk/conditions/appendicitis/', reviewed:SOURCE_REVIEW_DATE,
  },
  brc_fracture: {
    authority:'British Red Cross', title:'First aid for a broken bone', url:'https://www.redcross.org.uk/first-aid/learn-first-aid/broken-bone', reviewed:SOURCE_REVIEW_DATE,
  },
  nhs_when_999: {
    authority:'NHS', title:'When to call 999', url:'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/', reviewed:SOURCE_REVIEW_DATE,
  },
});

export const scenarioSources = Object.freeze({
  scene_unsafe:['rcuk_first_aid_2025','nhs_when_999'],
  unconscious_breathing:['rcuk_adult_bls_2025','nhs_recovery_position'],
  severe_bleeding:['rcuk_first_aid_2025'],
  choking_adult:['rcuk_first_aid_2025'],
  choking_child:['rcuk_first_aid_2025','rcuk_paediatric_cpr_2025'],
  choking_infant:['rcuk_first_aid_2025','rcuk_paediatric_cpr_2025'],
  breathing_difficulty:['nhs_breathlessness','nhs_when_999'],
  asthma:['nhs_asthma'],
  chest_pain:['rcuk_first_aid_2025','nhs_heart_attack'],
  shock:['rcuk_first_aid_2025','nhs_when_999'],
  major_wound:['rcuk_first_aid_2025'],
  amputation:['rcuk_first_aid_2025','nhs_when_999'],
  stroke:['rcuk_first_aid_2025','nhs_stroke'],
  seizure:['nhs_seizure'],
  head_spine_injury:['rcuk_first_aid_2025','nhs_when_999'],
  anaphylaxis:['rcuk_first_aid_2025'],
  fracture:['brc_fracture'],
  crush_injury:['rcuk_first_aid_2025','nhs_when_999'],
  burn_thermal:['nhs_burns'],
  burn_chemical:['nhs_chemical_burn'],
  burn_electrical:['nhs_burns'],
  poisoning:['nhs_poisoning'],
  inhalation_exposure:['nhs_breathlessness','nhs_when_999'],
  drowning:['rcuk_first_aid_2025','rcuk_adult_bls_2025'],
  hypothermia:['nhs_hypothermia'],
  heat_illness:['nhs_heatstroke'],
  diabetic:['nhs_hypoglycaemia'],
  fainting:['nhs_fainting'],
  severe_abdominal:['nhs_abdominal','nhs_when_999'],
  pregnancy_emergency:['nhs_pregnancy_bleeding','nhs_when_999'],
  child_warning:['nhs_under5_urgent'],
  infant_warning:['nhs_under5_urgent'],
  cpr_adult:['rcuk_adult_bls_2025'],
  cpr_child:['rcuk_paediatric_cpr_2025'],
  cpr_infant:['rcuk_paediatric_cpr_2025'],

  // Live construction runtime aliases.
  cpr:['rcuk_adult_bls_2025'],
  choking:['rcuk_first_aid_2025'],
  fall_head_spine:['rcuk_first_aid_2025','nhs_when_999'],
  electrical_injury:['nhs_burns','nhs_when_999'],
  thermal_burn:['nhs_burns'],
  chemical_burn:['nhs_chemical_burn'],
  operator:['nhs_when_999'],

  // V1.0005 Site Medical Pack runtime IDs.
  open_chest_wound:['rcuk_first_aid_2025','nhs_when_999'],
  fracture_dislocation:['brc_fracture','nhs_when_999'],
  eye_injury:['nhs_eye_injuries'],
  fume_inhalation:['nhs_breathlessness','nhs_when_999'],
  hypoglycaemia:['nhs_hypoglycaemia'],
});

export function getScenarioSources(scenarioId) {
  return (scenarioSources[scenarioId] || []).map((id) => ({ id, ...sources[id] })).filter((source) => source.url);
}
