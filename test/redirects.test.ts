import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// @ts-ignore: plain .mjs generator
import { INDEXED_CITIES, ZONE_KEEP } from '../scripts/gen-city-pages.mjs';

const cities: { slug: string }[] = JSON.parse(readFileSync('src/cities.json', 'utf8'));
const zones: { slug: string }[] = JSON.parse(readFileSync('src/zones.json', 'utf8'));
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));

// Mirrors how Vercel compiles the source: named params become plain capture groups.
const rules = vercel.redirects.map((r: { source: string; destination: string; statusCode: number }) => ({
  ...r,
  re: new RegExp(`^${r.source.replace(/:from\(/, '(').replace(/:to\(/, '(')}$`),
}));
const match = (path: string) => rules.find((r: { re: RegExp }) => r.re.test(path));

test('kept conversion pages are not redirected, the other zone pairs are', () => {
  for (const a of zones) for (const b of zones) {
    if (a.slug === b.slug) continue;
    const slug = `${a.slug}-to-${b.slug}`;
    const rule = match(`/time/${slug}`);
    if (ZONE_KEEP.includes(slug)) assert.equal(rule, undefined, slug);
    else assert.ok(rule, slug);
  }
});

test('city pairs redirect to the converter with both cities filled in', () => {
  const m = '/time/new-york-to-hong-kong'.match(match('/time/new-york-to-hong-kong').re)!;
  assert.deepEqual([m[1], m[2]], ['new-york', 'hong-kong']);
  for (const r of rules) {
    assert.equal(r.statusCode, 301);
    assert.equal(r.destination, '/time-zone-converter?from=:from&to=:to');
  }
});

test('plain city pages are never caught by a redirect', () => {
  for (const c of cities) assert.equal(match(`/time/${c.slug}`), undefined, c.slug);
});

test('the indexed city list only names real cities, without repeats', () => {
  const slugs = new Set(cities.map((c) => c.slug));
  assert.equal(new Set(INDEXED_CITIES).size, INDEXED_CITIES.length);
  for (const s of INDEXED_CITIES) assert.ok(slugs.has(s), s);
});
