import { CITIES } from './city-picker';
import zones from '../zones.json';
import { localizeRecord } from './placeNames';

// Everything a time can be converted from or to: abbreviations first, then cities.
export const PLACES = [
  ...zones.map((z) => localizeRecord({ slug: z.slug, name: z.abbr, country: z.name, tz: z.tz }, ['country'])),
  ...CITIES,
];
