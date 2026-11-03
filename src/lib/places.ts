import { CITIES } from './city-picker';
import zones from '../zones.json';

// Everything a time can be converted from or to: abbreviations first, then cities.
export const PLACES = [
  ...zones.map((z) => ({ slug: z.slug, name: z.abbr, country: z.name, tz: z.tz })),
  ...CITIES,
];
