import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fold, placeNameEs } from '../src/lib/placeNames';

test('placeNameEs translates exonyms and countries, and leaves the rest alone', () => {
  assert.equal(placeNameEs('New York'), 'Nueva York');
  assert.equal(placeNameEs('Mexico City'), 'Ciudad de México');
  assert.equal(placeNameEs('Spain'), 'España');
  assert.equal(placeNameEs('Japan'), 'Japón');
  assert.equal(placeNameEs('Madrid'), 'Madrid');
  assert.equal(placeNameEs('Nowhere'), 'Nowhere');
});

test('short and map-style country names used by the app are translated', () => {
  const cases: [string, string][] = [
    ['USA', 'Estados Unidos'], ['UK', 'Reino Unido'], ['UAE', 'Emiratos Árabes Unidos'], ['Turkey', 'Turquía'],
    ['Czechia', 'Chequia'], ['Ivory Coast', 'Costa de Marfil'], ['United States of America', 'Estados Unidos'],
  ];
  for (const [en, es] of cases) assert.equal(placeNameEs(en), es, en);
});

test('fold ignores case and accents', () => {
  assert.equal(fold('Pekín'), 'pekin');
  assert.ok(fold('Ciudad de México').includes(fold('mexico')));
});
