export const Screen = Object.freeze({
  HOME: 'HOME',
  TRIAGE: 'TRIAGE',
  PICK_SCENARIO: 'PICK_SCENARIO',
  SCENARIO: 'SCENARIO',
  CPR_SELECT: 'CPR_SELECT',
  CPR: 'CPR',
  SYMPTOMS: 'SYMPTOMS',
  LOCATION: 'LOCATION',
});

export const Answer = Object.freeze({
  YES: 'YES',
  NO: 'NO',
  UNKNOWN: 'UNKNOWN',
});

export const Question = Object.freeze({
  SCENE_SAFE: 'scene_safe',
  RESPONSIVE: 'responsive',
  BREATHING: 'breathing',
  SEVERE_BLEEDING: 'severe_bleeding',
});

export function createState(language = 'en') {
  return {
    screen: Screen.HOME,
    language,
    emergencyActive: false,
    triage: {
      currentQuestion: null,
      answers: {},
    },
    scenarioId: null,
    cprAge: null,
    symptomQuery: '',
    symptomMatch: null,
    location: {
      status: 'IDLE',
      latitude: null,
      longitude: null,
      accuracyMetres: null,
    },
  };
}

export function beginEmergency(state) {
  return {
    ...state,
    screen: Screen.TRIAGE,
    emergencyActive: true,
    scenarioId: null,
    cprAge: null,
    symptomMatch: null,
    triage: {
      currentQuestion: Question.SCENE_SAFE,
      answers: {},
    },
  };
}

export function setLanguage(state, language) {
  return { ...state, language };
}

export function resetEmergency(state) {
  return createState(state.language);
}

export function openScenario(state, scenarioId, { emergencyActive = true } = {}) {
  return {
    ...state,
    screen: Screen.SCENARIO,
    emergencyActive,
    scenarioId,
  };
}

export function openSymptoms(state) {
  return { ...state, screen: Screen.SYMPTOMS };
}

export function openScenarioPicker(state) {
  return { ...state, screen: Screen.PICK_SCENARIO };
}

export function openLocation(state) {
  return { ...state, screen: Screen.LOCATION };
}

export function chooseCprAge(state, cprAge) {
  if (!['adult', 'child', 'infant'].includes(cprAge)) return state;
  return {
    ...state,
    screen: Screen.CPR,
    emergencyActive: true,
    cprAge,
    scenarioId: `cpr_${cprAge}`,
  };
}

export function goToCprSelect(state) {
  return {
    ...state,
    screen: Screen.CPR_SELECT,
    emergencyActive: true,
    scenarioId: null,
  };
}

export function answerTriage(state, answer) {
  if (![Answer.YES, Answer.NO, Answer.UNKNOWN].includes(answer)) return state;
  const question = state.triage.currentQuestion;
  if (!question) return state;

  const answers = {
    ...state.triage.answers,
    [question]: answer,
  };

  if (question === Question.SCENE_SAFE) {
    if (answer === Answer.YES) {
      return withTriage(state, answers, Question.RESPONSIVE);
    }
    return openScenario(withAnswers(state, answers), 'scene_unsafe');
  }

  if (question === Question.RESPONSIVE) {
    if (answer === Answer.YES) {
      return withTriage(state, answers, Question.SEVERE_BLEEDING);
    }
    return withTriage(state, answers, Question.BREATHING);
  }

  if (question === Question.BREATHING) {
    if (answer === Answer.YES) {
      return openScenario(withAnswers(state, answers), 'unconscious_breathing');
    }
    return goToCprSelect(withAnswers(state, answers));
  }

  if (question === Question.SEVERE_BLEEDING) {
    if (answer === Answer.YES) {
      return openScenario(withAnswers(state, answers), 'severe_bleeding');
    }
    return {
      ...withAnswers(state, answers),
      screen: Screen.PICK_SCENARIO,
      emergencyActive: true,
      scenarioId: null,
    };
  }

  return state;
}

function withAnswers(state, answers) {
  return {
    ...state,
    triage: {
      ...state.triage,
      answers,
    },
  };
}

function withTriage(state, answers, currentQuestion) {
  return {
    ...state,
    screen: Screen.TRIAGE,
    emergencyActive: true,
    triage: { answers, currentQuestion },
  };
}

export function setSymptomResult(state, symptomQuery, symptomMatch) {
  return {
    ...state,
    symptomQuery,
    symptomMatch,
  };
}

export function routeSymptomMatch(state, match) {
  if (!match) return { ...state, screen: Screen.PICK_SCENARIO, emergencyActive: true };
  if (match.type === 'CPR_SELECT') return goToCprSelect(state);
  if (match.type === 'CPR') return chooseCprAge(goToCprSelect(state), match.age);
  if (match.type === 'UNRESPONSIVE_CHECK_BREATHING') {
    return {
      ...state,
      screen: Screen.TRIAGE,
      emergencyActive: true,
      triage: {
        answers: { ...state.triage.answers, [Question.RESPONSIVE]: Answer.NO },
        currentQuestion: Question.BREATHING,
      },
    };
  }
  if (match.scenarioId) return openScenario(state, match.scenarioId);
  return { ...state, screen: Screen.PICK_SCENARIO, emergencyActive: true };
}

export function setLocationStatus(state, location) {
  return {
    ...state,
    location: {
      ...state.location,
      ...location,
    },
  };
}
