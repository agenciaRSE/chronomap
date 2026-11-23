// Spanish display names for cities and countries. Saved locations, shared links and city data keep the English
// names; on /es pages they are translated only when shown, so switching language never breaks a saved list.
// Countries come from Intl.DisplayNames (the browser's own CLDR data); cities only list the ones whose Spanish
// name differs (exonyms). Anything unknown is shown as is.

import { isES } from './i18n';

const CITY_ES: Record<string, string> = {
  'New York': 'Nueva York', 'Washington D.C.': 'Washington D. C.', 'Washington, D.C.': 'Washington D. C.',
  "St. John's": 'San Juan de Terranova', 'Mexico City': 'Ciudad de México', 'Havana': 'La Habana',
  'Panama City': 'Ciudad de Panamá', 'Guatemala City': 'Ciudad de Guatemala', 'Port-au-Prince': 'Puerto Príncipe',
  'Port of Spain': 'Puerto España', 'Brasília': 'Brasilia', 'Sao Paulo': 'São Paulo',
  'London': 'Londres', 'Edinburgh': 'Edimburgo', 'Lisbon': 'Lisboa', 'Brussels': 'Bruselas',
  'Berlin': 'Berlín', 'Munich': 'Múnich', 'Frankfurt': 'Fráncfort', 'Vienna': 'Viena', 'Zurich': 'Zúrich',
  'Geneva': 'Ginebra', 'Rome': 'Roma', 'Milan': 'Milán', 'Prague': 'Praga', 'Warsaw': 'Varsovia',
  'Ljubljana': 'Liubliana', 'Stockholm': 'Estocolmo', 'Copenhagen': 'Copenhague', 'Reykjavik': 'Reikiavik',
  'Reykjavík': 'Reikiavik', 'Moscow': 'Moscú', 'St. Petersburg': 'San Petersburgo', 'Saint Petersburg': 'San Petersburgo',
  'Kyiv': 'Kiev', 'Chisinau': 'Chisináu', 'Istanbul': 'Estambul', 'Athens': 'Atenas',
  'Bucharest': 'Bucarest', 'Belgrade': 'Belgrado', 'Skopje': 'Skopie', 'Sofia': 'Sofía', 'Valletta': 'La Valeta',
  'Tokyo': 'Tokio', 'Seoul': 'Seúl', 'Beijing': 'Pekín', 'Shanghai': 'Shanghái', 'Hong Kong': 'Hong Kong',
  'Taipei': 'Taipéi', 'Ulaanbaatar': 'Ulán Bator', 'Jakarta': 'Yakarta', 'Hanoi': 'Hanói',
  'Ho Chi Minh City': 'Ciudad Ho Chi Minh', 'Ho Chi Minh': 'Ciudad Ho Chi Minh', 'Phnom Penh': 'Nom Pen',
  'Vientiane': 'Vientián', 'Yangon': 'Rangún', 'New Delhi': 'Nueva Delhi', 'Mumbai': 'Bombay', 'Kolkata': 'Calcuta',
  'Dhaka': 'Daca', 'Kathmandu': 'Katmandú', 'Thimphu': 'Timbu', 'Tashkent': 'Taskent', 'Bishkek': 'Biskek',
  'Dushanbe': 'Dusambé', 'Ashgabat': 'Asjabad', 'Dubai': 'Dubái', 'Abu Dhabi': 'Abu Dabi', 'Riyadh': 'Riad',
  'Jeddah': 'Yeda', 'Tehran': 'Teherán', 'Baghdad': 'Bagdad', 'Yafa': 'Jaffa', 'Jerusalem': 'Jerusalén',
  'Amman': 'Amán', 'Damascus': 'Damasco', 'Kuwait City': 'Ciudad de Kuwait', 'Muscat': 'Mascate',
  "Sana'a": 'Saná', 'Baku': 'Bakú', 'Yerevan': 'Ereván', 'Tbilisi': 'Tiflis', 'Cairo': 'El Cairo',
  'Johannesburg': 'Johannesburgo', 'Cape Town': 'Ciudad del Cabo', 'Addis Ababa': 'Adís Abeba', 'Algiers': 'Argel',
  'Tunis': 'Túnez', 'Tripoli': 'Trípoli', 'Khartoum': 'Jartum', 'Abidjan': 'Abiyán', 'Ouagadougou': 'Uagadugú',
  'Sydney': 'Sídney', 'Nouméa': 'Numea', 'Occupied territories': 'Territorios ocupados',
  // Countries whose CLDR Spanish name is not the usual one in Spain
  'Ivory Coast': 'Costa de Marfil', "Côte d'Ivoire": 'Costa de Marfil',
  // Time zone names (converter)
  'Eastern Standard Time': 'Hora estándar del Este (EE. UU.)', 'Central Standard Time': 'Hora estándar central (EE. UU.)',
  'Mountain Standard Time': 'Hora estándar de las Montañas (EE. UU.)', 'Pacific Standard Time': 'Hora estándar del Pacífico (EE. UU.)',
  'Greenwich Mean Time': 'Hora media de Greenwich', 'Coordinated Universal Time': 'Tiempo universal coordinado',
  'British Summer Time': 'Hora de verano británica', 'Central European Time': 'Hora de Europa central',
  'India Standard Time': 'Hora estándar de la India', 'Gulf Standard Time': 'Hora estándar del Golfo',
  'Singapore Time': 'Hora de Singapur', 'Hong Kong Time': 'Hora de Hong Kong', 'Japan Standard Time': 'Hora estándar de Japón',
  'Korea Standard Time': 'Hora estándar de Corea', 'Australian Eastern Standard Time': 'Hora estándar del este de Australia',
};

// Short or map-style English country names that Intl does not use, mapped to their ISO code.
const ALIAS: Record<string, string> = {
  'USA': 'US', 'United States of America': 'US', 'UK': 'GB', 'UAE': 'AE', 'DR Congo': 'CD', 'Dem. Rep. Congo': 'CD',
  'Dominican Rep.': 'DO', 'Dom. Rep.': 'DO', 'Ivory Coast': 'CI', "Côte d'Ivoire": 'CI', 'Bosnia': 'BA',
  'Bosnia and Herz.': 'BA', 'Palestine': 'PS', 'Myanmar': 'MM', 'Turkey': 'TR', 'CAR': 'CF',
  'Central African Rep.': 'CF', 'PNG': 'PG', 'Trinidad': 'TT', 'N. Macedonia': 'MK', 'Macedonia': 'MK',
  'Eq. Guinea': 'GQ', 'Solomon Is.': 'SB', 'Marshall Is.': 'MH', 'St. Vincent': 'VC', 'Antigua': 'AG',
  'St. Kitts': 'KN', 'Micronesia': 'FM', 'S. Sudan': 'SS', 'W. Sahara': 'EH', 'Falkland Is.': 'FK',
  'Fr. S. Antarctic Lands': 'TF', 'Kosovo': 'XK', 'eSwatini': 'SZ', 'Czech Republic': 'CZ', 'Russian Federation': 'RU',
  'Congo': 'CG', 'Cape Verde': 'CV',
};

let countryEs: Map<string, string> | null = null;
function countries(): Map<string, string> {
  if (countryEs) return countryEs;
  countryEs = new Map();
  try {
    const en = new Intl.DisplayNames(['en'], { type: 'region' });
    const es = new Intl.DisplayNames(['es'], { type: 'region' });
    for (let i = 0; i < 26; i++) for (let j = 0; j < 26; j++) {
      const code = String.fromCharCode(65 + i, 65 + j);
      const name = en.of(code);
      if (name && name !== code) countryEs.set(name, es.of(code) ?? name);
    }
    for (const [name, code] of Object.entries(ALIAS)) countryEs.set(name, es.of(code) ?? name);
  } catch { /* very old browser: names stay in English */ }
  return countryEs;
}

/** Lowercase without accents, so «pekin» finds «Pekín» and «mexico» finds «México». */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** One place name (a city or a country) in Spanish; unknown names come back unchanged. */
export function placeNameEs(name: string): string {
  return CITY_ES[name] ?? countries().get(name) ?? name;
}

/** On /es pages, a copy of a data record with the given fields in Spanish; `alt` keeps the English text so
 *  searches still match it. On English pages the record comes back untouched. */
export function localizeRecord<T extends object>(r: T, keys: (keyof T)[]): T & { alt?: string } {
  if (!isES) return r;
  const out = { ...r, alt: keys.map((k) => String(r[k])).join(' ') } as T & { alt?: string };
  for (const k of keys) (out as Record<keyof T, unknown>)[k] = placeNameEs(String(r[k]));
  return out;
}

/** "City, Country" (or a single place) in the page language. */
export function localizePlace(name: string): string {
  return isES ? name.split(', ').map(placeNameEs).join(', ') : name;
}
