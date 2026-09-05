export const scenarioGroups = Object.freeze([
  { id: 'airway', titleKey: 'group_airway', scenarioIds: ['unconscious_breathing', 'choking_adult', 'choking_child', 'choking_infant', 'breathing_difficulty', 'asthma'] },
  { id: 'circulation', titleKey: 'group_circulation', scenarioIds: ['severe_bleeding', 'chest_pain', 'shock', 'major_wound', 'amputation'] },
  { id: 'neurological', titleKey: 'group_neuro', scenarioIds: ['stroke', 'seizure', 'head_spine_injury'] },
  { id: 'allergy', titleKey: 'group_allergy', scenarioIds: ['anaphylaxis'] },
  { id: 'trauma', titleKey: 'group_trauma', scenarioIds: ['fracture', 'crush_injury'] },
  { id: 'burns', titleKey: 'group_burns', scenarioIds: ['burn_thermal', 'burn_chemical', 'burn_electrical'] },
  { id: 'poisoning', titleKey: 'group_poisoning', scenarioIds: ['poisoning', 'inhalation_exposure'] },
  { id: 'environment', titleKey: 'group_environment', scenarioIds: ['drowning', 'hypothermia', 'heat_illness'] },
  { id: 'other', titleKey: 'group_other', scenarioIds: ['diabetic', 'fainting', 'severe_abdominal', 'pregnancy_emergency', 'child_warning', 'infant_warning'] },
]);

export const scenarios = Object.freeze({
  scene_unsafe: {
    titleKey: 'scenario_scene_unsafe', icon: '⚠️', lifeThreatening: true,
    steps: ['scene_stay_back', 'step_call_999', 'scene_wait_safe'],
  },
  unconscious_breathing: {
    titleKey: 'scenario_unconscious_breathing', icon: '🫁', lifeThreatening: true,
    steps: ['step_call_999', 'recovery_position', 'monitor_breathing', 'spine_airway_priority'],
  },
  severe_bleeding: {
    titleKey: 'scenario_severe_bleeding', icon: '🩸', lifeThreatening: true,
    steps: ['step_call_999', 'bleed_direct_pressure', 'bleed_dressing', 'bleed_tourniquet', 'keep_warm'],
  },
  choking_adult: {
    titleKey: 'scenario_choking_adult', icon: '🫁', lifeThreatening: true,
    steps: ['choke_cough', 'choke_back_blows', 'choke_abdominal', 'step_call_999', 'choke_unresponsive_cpr'],
  },
  choking_child: {
    titleKey: 'scenario_choking_child', icon: '🧒', lifeThreatening: true,
    steps: ['choke_cough', 'choke_back_blows', 'choke_abdominal', 'step_call_999', 'choke_unresponsive_cpr'],
  },
  choking_infant: {
    titleKey: 'scenario_choking_infant', icon: '👶', lifeThreatening: true,
    steps: ['choke_infant_back_blows', 'choke_infant_chest_thrusts', 'step_call_999', 'choke_unresponsive_cpr'],
  },
  breathing_difficulty: {
    titleKey: 'scenario_breathing_difficulty', icon: '🫁', lifeThreatening: true,
    steps: ['step_call_999', 'breathing_position', 'monitor_breathing'],
  },
  asthma: {
    titleKey: 'scenario_asthma', icon: '🫁', lifeThreatening: true,
    steps: ['asthma_inhaler', 'breathing_position', 'step_call_999', 'monitor_breathing'],
  },
  chest_pain: {
    titleKey: 'scenario_chest_pain', icon: '❤️', lifeThreatening: true,
    steps: ['step_call_999', 'chest_rest', 'chest_aspirin', 'chest_gtn', 'monitor_breathing'],
  },
  shock: {
    titleKey: 'scenario_shock', icon: '⚠️', lifeThreatening: true,
    steps: ['step_call_999', 'lie_down', 'keep_warm', 'monitor_breathing'],
  },
  major_wound: {
    titleKey: 'scenario_major_wound', icon: '🩹', lifeThreatening: true,
    steps: ['call_999_if_needed', 'bleed_direct_pressure', 'bleed_dressing', 'keep_warm'],
  },
  amputation: {
    titleKey: 'scenario_amputation', icon: '🩸', lifeThreatening: true,
    steps: ['step_call_999', 'bleed_direct_pressure', 'bleed_tourniquet', 'amputation_operator', 'keep_warm'],
  },
  stroke: {
    titleKey: 'scenario_stroke', icon: '🧠', lifeThreatening: true,
    steps: ['stroke_fast', 'step_call_999', 'stroke_time', 'no_food_drink'],
  },
  seizure: {
    titleKey: 'scenario_seizure', icon: '🧠', lifeThreatening: false,
    emergencyCriteriaKey: 'criteria_seizure',
    steps: ['seizure_protect', 'seizure_time', 'seizure_nothing_mouth', 'seizure_after', 'seizure_call_criteria'],
  },
  head_spine_injury: {
    titleKey: 'scenario_head_spine', icon: '🧠', lifeThreatening: true,
    steps: ['step_call_999', 'spine_minimise', 'spine_airway_priority', 'monitor_breathing'],
  },
  anaphylaxis: {
    titleKey: 'scenario_anaphylaxis', icon: '⚠️', lifeThreatening: true,
    steps: ['anaphylaxis_adrenaline', 'step_call_999', 'anaphylaxis_position', 'anaphylaxis_second', 'monitor_breathing'],
  },
  fracture: {
    titleKey: 'scenario_fracture', icon: '🦴', lifeThreatening: false,
    steps: ['fracture_support', 'minimise_movement', 'fracture_help'],
  },
  crush_injury: {
    titleKey: 'scenario_crush', icon: '🏗️', lifeThreatening: true,
    steps: ['scene_stay_back', 'step_call_999', 'crush_operator', 'monitor_breathing'],
  },
  burn_thermal: {
    titleKey: 'scenario_burn_thermal', icon: '🔥', lifeThreatening: false,
    emergencyCriteriaKey: 'criteria_burn',
    steps: ['burn_cool_20', 'burn_remove', 'burn_cover', 'burn_no_ice', 'call_999_if_needed'],
  },
  burn_chemical: {
    titleKey: 'scenario_burn_chemical', icon: '🧪', lifeThreatening: true,
    steps: ['scene_stay_back', 'step_call_999', 'chemical_brush', 'chemical_rinse', 'burn_no_ice'],
  },
  burn_electrical: {
    titleKey: 'scenario_burn_electrical', icon: '⚡', lifeThreatening: true,
    steps: ['electrical_isolate', 'step_call_999', 'monitor_breathing', 'burn_cool_20'],
  },
  poisoning: {
    titleKey: 'scenario_poisoning', icon: '☠️', lifeThreatening: true,
    steps: ['step_call_999', 'poison_no_vomit', 'no_food_drink', 'poison_packaging', 'monitor_breathing'],
  },
  inhalation_exposure: {
    titleKey: 'scenario_inhalation', icon: '☣️', lifeThreatening: true,
    steps: ['scene_stay_back', 'step_call_999', 'fresh_air_if_safe', 'monitor_breathing'],
  },
  drowning: {
    titleKey: 'scenario_drowning', icon: '🌊', lifeThreatening: true,
    steps: ['drowning_no_entry', 'step_call_999', 'drowning_five_breaths', 'drowning_cpr', 'drowning_aed'],
  },
  hypothermia: {
    titleKey: 'scenario_hypothermia', icon: '❄️', lifeThreatening: true,
    steps: ['step_call_999', 'hypothermia_shelter', 'hypothermia_wet', 'hypothermia_insulate', 'monitor_breathing'],
  },
  heat_illness: {
    titleKey: 'scenario_heat', icon: '🌡️', lifeThreatening: true,
    steps: ['step_call_999', 'heat_remove', 'heat_cool', 'monitor_breathing'],
  },
  diabetic: {
    titleKey: 'scenario_diabetic', icon: '🍬', lifeThreatening: false,
    steps: ['diabetic_sugar_if_awake', 'diabetic_no_oral_unconscious', 'call_999_if_needed', 'monitor_breathing'],
  },
  fainting: {
    titleKey: 'scenario_fainting', icon: '🧍', lifeThreatening: false,
    steps: ['faint_lie_down', 'faint_recover_slow', 'call_999_if_needed', 'monitor_breathing'],
  },
  severe_abdominal: {
    titleKey: 'scenario_abdominal', icon: '⚠️', lifeThreatening: false,
    steps: ['abdominal_rest', 'call_999_if_needed', 'no_food_drink'],
  },
  pregnancy_emergency: {
    titleKey: 'scenario_pregnancy', icon: '🤰', lifeThreatening: true,
    steps: ['step_call_999', 'pregnancy_position', 'monitor_breathing'],
  },
  child_warning: {
    titleKey: 'scenario_child_warning', icon: '🧒', lifeThreatening: true,
    steps: ['child_red_flags', 'step_call_999', 'monitor_breathing'],
  },
  infant_warning: {
    titleKey: 'scenario_infant_warning', icon: '👶', lifeThreatening: true,
    steps: ['infant_red_flags', 'step_call_999', 'monitor_breathing'],
  },
  cpr_adult: {
    titleKey: 'scenario_cpr_adult', icon: '❤️', lifeThreatening: true,
    steps: ['cpr_call_speaker', 'cpr_adult_compressions', 'cpr_adult_rate_depth', 'cpr_adult_breaths', 'cpr_aed'],
  },
  cpr_child: {
    titleKey: 'scenario_cpr_child', icon: '🧒', lifeThreatening: true,
    steps: ['cpr_call_speaker', 'cpr_child_five_breaths', 'cpr_child_compressions', 'cpr_child_rate_depth', 'cpr_child_breaths', 'cpr_aed'],
  },
  cpr_infant: {
    titleKey: 'scenario_cpr_infant', icon: '👶', lifeThreatening: true,
    steps: ['cpr_call_speaker', 'cpr_infant_five_breaths', 'cpr_infant_compressions', 'cpr_infant_rate_depth', 'cpr_infant_breaths', 'cpr_aed'],
  },
});

export const quickScenarioIds = Object.freeze([
  'severe_bleeding',
  'choking_adult',
  'stroke',
  'chest_pain',
  'anaphylaxis',
  'seizure',
]);

const keywordRoutes = Object.freeze([
  { type: 'CPR', age: 'infant', highRisk: true, terms: ['baby not breathing','infant not breathing','niemowle nie oddycha','bebé no respira','bebe nao respira','bébé ne respire pas','bambino non respira','bebek nefes almıyor','дитина не дихає','бебе не диша','طفل لا يتنفس','بچہ سانس نہیں لے رہا','শিশু শ্বাস নিচ্ছে না','બાળક શ્વાસ લેતું નથી','婴儿没有呼吸'] },
  { type: 'CPR', age: 'child', highRisk: true, terms: ['child not breathing','kid not breathing','dziecko nie oddycha','niño no respira','criança nao respira','enfant ne respire pas','bambino non respira','çocuk nefes almıyor','дитина не дихає','дете не диша','طفل لا يتنفس','بچہ سانس نہیں لے رہا','শিশু শ্বাস নিচ্ছে না','બાળક શ્વાસ લેતું નથી','孩子没有呼吸'] },
  { type: 'CPR_SELECT', highRisk: true, terms: ['not breathing','no breathing','cardiac arrest','stopped breathing','nie oddycha','brak oddechu','zatrzymanie krazenia','nu respira','stop cardiac','no respira','paro cardiaco','nao respira','paragem cardiaca','ne respire pas','arrêt cardiaque','non respira','arresto cardiaco','nefes almıyor','kalp durması','не дихає','зупинка серця','не диша','сърдечен арест','لا يتنفس','توقف القلب','سانس نہیں','دل بند','শ্বাস নিচ্ছে না','হৃদযন্ত্র বন্ধ','શ્વાસ લેતું નથી','હૃદય બંધ','没有呼吸','心脏骤停'] },
  { type: 'UNRESPONSIVE_CHECK_BREATHING', highRisk: true, terms: ['unconscious','unresponsive','passed out','nieprzytom','bez kontaktu','inconstient','inconsciente','inconscient','incosciente','bilinçsiz','непритом','безсъзн','فاقد الوعي','بے ہوش','অচেতন','બેભાન','昏迷','失去意识'] },
  { scenarioId: 'severe_bleeding', highRisk: true, terms: ['severe bleeding','heavy bleeding','blood pumping','krwotok','silne krwawienie','sangerare severa','hemorragia','saignement abondant','sanguinamento grave','şiddetli kanama','сильна кровотеча','силно кървене','نزيف شديد','شدید خون','তীব্র রক্তপাত','ભારે રક્તસ્ત્રાવ','大出血'] },
  { scenarioId: 'choking_adult', highRisk: true, terms: ['choking','cannot breathe food','dławi','zadław','înec','atragant','engasga','étouff','soffoc','boğul','подавив','задав','اختناق','گلا گھٹ','শ্বাসরোধ','ગળામાં અટક','噎住'] },
  { scenarioId: 'stroke', highRisk: true, terms: ['stroke','face droop','arm weakness','slurred speech','udar','opadnieta twarz','avc','accidente vascular','derrame','ictus','inme','інсульт','инсулт','سكتة','فالج','স্ট্রোক','સ્ટ્રોક','中风'] },
  { scenarioId: 'chest_pain', highRisk: true, terms: ['chest pain','heart attack','tight chest','ból w klatce','zawał','durere in piept','infarto','dor no peito','douleur thoracique','crise cardiaque','dolore al petto','kalp krizi','біль у грудях','інфаркт','болка в гърдите','نوبة قلبية','سینے میں درد','বুকে ব্যথা','છાતીમાં દુખાવો','胸痛','心脏病发作'] },
  { scenarioId: 'anaphylaxis', highRisk: true, terms: ['anaphylaxis','severe allergy','swollen tongue','allergic reaction','anafilaks','silna alerg','anafilax','alergia severa','allergie sévère','anafilassi','anafilaksi','анафілакс','анафилак','حساسية شديدة','شدید الرجی','তীব্র অ্যালার্জি','ગંભીર એલર્જી','严重过敏'] },
  { scenarioId: 'seizure', highRisk: false, terms: ['seizure','fit','convulsion','drgawki','padaczka','convulsie','convulsión','convulsao','crise convulsive','convulsioni','nöbet','судоми','гърч','تشنج','دورہ','খিঁচুনি','આંચકી','癫痫发作','抽搐'] },
  { scenarioId: 'burn_thermal', highRisk: false, terms: ['burn','scald','oparzenie','arsura','quemadura','queimadura','brûlure','ustione','yanık','опік','изгаряне','حرق','جلنا','পোড়া','દાઝ','烧伤'] },
  { scenarioId: 'poisoning', highRisk: true, terms: ['poison','overdose','swallowed chemical','zatrucie','przedawkowanie','otravire','intoxicación','envenenamento','empoisonnement','avvelenamento','zehirlenme','отруєння','отравяне','تسمم','زہر','বিষক্রিয়া','ઝેર','中毒'] },
  { scenarioId: 'asthma', highRisk: true, terms: ['asthma','wheeze','inhaler','astma','respiratie suieratoare','asma','asthme','asma','astım','астма','ربو','دمہ','হাঁপানি','અસ્થમા','哮喘'] },
  { scenarioId: 'drowning', highRisk: true, terms: ['drowning','under water','utonięcie','tonie','înec','ahog','afog','noyade','anneg','boğulma','утоплен','удавяне','غرق','ڈوب','ডুবে','ડૂબ','溺水'] },
  { scenarioId: 'heat_illness', highRisk: true, terms: ['heat stroke','heatstroke','overheated confused','udar cieplny','insolatie','golpe de calor','coup de chaleur','colpo di calore','sıcak çarpması','тепловий удар','топлинен удар','ضربة شمس','ہیٹ اسٹروک','হিট স্ট্রোক','હીટ સ્ટ્રોક','中暑'] },
]);

export function normaliseSymptomText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function routeSymptoms(text) {
  const haystack = normaliseSymptomText(text);
  if (!haystack) return null;
  for (const route of keywordRoutes) {
    const hit = route.terms.find((term) => haystack.includes(normaliseSymptomText(term)));
    if (hit) return { ...route, matchedTerm: hit, terms: undefined };
  }
  return null;
}

export function getScenario(id) {
  return scenarios[id] || null;
}
