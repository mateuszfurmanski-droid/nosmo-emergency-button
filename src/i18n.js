import en from './lang/en.js';
import pl from './lang/pl.js';
import ro from './lang/ro.js';
import ur from './lang/ur.js';
import pa from './lang/pa.js';
import bn from './lang/bn.js';
import gu from './lang/gu.js';
import ar from './lang/ar.js';
import pt from './lang/pt.js';
import es from './lang/es.js';
import fr from './lang/fr.js';
import lt from './lang/lt.js';
import bg from './lang/bg.js';
import uk from './lang/uk.js';
import zh from './lang/zh.js';
import tr from './lang/tr.js';
import it from './lang/it.js';

const packs = Object.freeze({ en, pl, ro, ur, pa, bn, gu, ar, pt, es, fr, lt, bg, uk, zh, tr, it });

export const LANGUAGES = Object.freeze([
  { code:'en', name:'English', nativeName:'English', flag:'🇬🇧', locale:'en-GB', dir:'ltr' },
  { code:'pl', name:'Polish', nativeName:'Polski', flag:'🇵🇱', locale:'pl-PL', dir:'ltr' },
  { code:'ro', name:'Romanian', nativeName:'Română', flag:'🇷🇴', locale:'ro-RO', dir:'ltr' },
  { code:'ur', name:'Urdu', nativeName:'اردو', flag:'🇵🇰', locale:'ur-PK', dir:'rtl' },
  { code:'pa', name:'Punjabi', nativeName:'ਪੰਜਾਬੀ', flag:'🇮🇳', locale:'pa-IN', dir:'ltr' },
  { code:'bn', name:'Bengali', nativeName:'বাংলা', flag:'🇧🇩', locale:'bn-BD', dir:'ltr' },
  { code:'gu', name:'Gujarati', nativeName:'ગુજરાતી', flag:'🇮🇳', locale:'gu-IN', dir:'ltr' },
  { code:'ar', name:'Arabic', nativeName:'العربية', flag:'🇸🇦', locale:'ar-SA', dir:'rtl' },
  { code:'pt', name:'Portuguese', nativeName:'Português', flag:'🇵🇹', locale:'pt-PT', dir:'ltr' },
  { code:'es', name:'Spanish', nativeName:'Español', flag:'🇪🇸', locale:'es-ES', dir:'ltr' },
  { code:'fr', name:'French', nativeName:'Français', flag:'🇫🇷', locale:'fr-FR', dir:'ltr' },
  { code:'lt', name:'Lithuanian', nativeName:'Lietuvių', flag:'🇱🇹', locale:'lt-LT', dir:'ltr' },
  { code:'bg', name:'Bulgarian', nativeName:'Български', flag:'🇧🇬', locale:'bg-BG', dir:'ltr' },
  { code:'uk', name:'Ukrainian', nativeName:'Українська', flag:'🇺🇦', locale:'uk-UA', dir:'ltr' },
  { code:'zh', name:'Chinese', nativeName:'中文', flag:'🇨🇳', locale:'zh-CN', dir:'ltr' },
  { code:'tr', name:'Turkish', nativeName:'Türkçe', flag:'🇹🇷', locale:'tr-TR', dir:'ltr' },
  { code:'it', name:'Italian', nativeName:'Italiano', flag:'🇮🇹', locale:'it-IT', dir:'ltr' },
]);

export function getLanguage(code) {
  return LANGUAGES.find((language) => language.code === code) || LANGUAGES[0];
}

export function supportedLanguage(code) {
  return Object.hasOwn(packs, code);
}

export function translate(code, key, variables = {}) {
  const pack = packs[code] || packs.en;
  let value = pack[key] ?? packs.en[key] ?? key;
  if (typeof value !== 'string') value = String(value);
  return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => String(variables[name] ?? `{${name}}`));
}

export function hasDirectTranslation(code, key) {
  return Object.hasOwn(packs[code] || {}, key);
}

export function getPack(code) {
  return packs[code] || packs.en;
}
