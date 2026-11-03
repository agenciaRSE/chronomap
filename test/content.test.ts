import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hm24, offsetMin, wallToUtc, ymdInTz } from '../src/lib/tz';
import { STYLES, parseTimestamp, preview } from '../src/lib/discord';
import { dailyPlan, estimate, preFlightBedtimes } from '../src/lib/jetlag';
import { findSlots } from '../src/lib/planner';
// @ts-ignore: plain .mjs generator
import { INDEXED_CITIES } from '../scripts/gen-city-pages.mjs';

const off = (iso: string, tz: string) => offsetMin(new Date(iso), tz) / 60;

// Claims in src/city-notes.json, checked against the time zone database.
test('city notes match the time zone history', () => {
  const cases: [string, string, string, number][] = [
    ['tokyo', '1950-07-01', 'Asia/Tokyo', 10], ['tokyo', '1953-07-01', 'Asia/Tokyo', 9],
    ['singapore', '1981-06-01', 'Asia/Singapore', 7.5], ['singapore', '1982-06-01', 'Asia/Singapore', 8],
    ['hong-kong', '1979-07-01', 'Asia/Hong_Kong', 9], ['hong-kong', '1980-07-01', 'Asia/Hong_Kong', 8],
    ['shanghai', '1991-07-01', 'Asia/Shanghai', 9], ['shanghai', '1992-07-01', 'Asia/Shanghai', 8],
    ['madrid', '1941-01-15', 'Europe/Madrid', 1],
    ['moscow', '2010-01-15', 'Europe/Moscow', 3], ['moscow', '2013-01-15', 'Europe/Moscow', 4], ['moscow', '2015-01-15', 'Europe/Moscow', 3],
    ['istanbul', '2016-01-15', 'Europe/Istanbul', 2], ['istanbul', '2017-01-15', 'Europe/Istanbul', 3],
    ['sao-paulo', '2019-01-15', 'America/Sao_Paulo', -2], ['sao-paulo', '2020-01-15', 'America/Sao_Paulo', -3],
    ['seoul', '1988-07-01', 'Asia/Seoul', 10], ['seoul', '1989-07-01', 'Asia/Seoul', 9],
    ['mexico-city', '2022-07-01', 'America/Mexico_City', -5], ['mexico-city', '2023-07-01', 'America/Mexico_City', -6],
    ['buenos-aires', '2009-01-15', 'America/Argentina/Buenos_Aires', -2], ['buenos-aires', '2010-01-15', 'America/Argentina/Buenos_Aires', -3],
    ['cairo', '2022-07-01', 'Africa/Cairo', 2], ['cairo', '2023-07-01', 'Africa/Cairo', 3],
    ['caracas', '2006-01-15', 'America/Caracas', -4], ['caracas', '2010-01-15', 'America/Caracas', -4.5], ['caracas', '2017-01-15', 'America/Caracas', -4],
    ['honolulu', '2026-01-15', 'Pacific/Honolulu', -10], ['honolulu', '2026-07-01', 'Pacific/Honolulu', -10],
    ['johannesburg', '2026-07-01', 'Africa/Johannesburg', 2], ['lagos', '2026-07-01', 'Africa/Lagos', 1],
    ['kigali', '2026-07-01', 'Africa/Kigali', 2], ['nairobi', '2026-07-01', 'Africa/Nairobi', 3],
    ['addis-ababa', '2026-07-01', 'Africa/Addis_Ababa', 3], ['luanda', '2026-07-01', 'Africa/Luanda', 1],
    ['muscat', '2026-07-01', 'Asia/Muscat', 4], ['dubai', '2026-07-01', 'Asia/Dubai', 4],
    ['bangkok', '2026-07-01', 'Asia/Bangkok', 7], ['jakarta', '2026-07-01', 'Asia/Jakarta', 7], ['ho-chi-minh-city', '2026-07-01', 'Asia/Ho_Chi_Minh', 7],
    ['manila', '2026-07-01', 'Asia/Manila', 8],
  ];
  for (const [city, date, tz, want] of cases) assert.equal(off(`${date}T12:00:00Z`, tz), want, `${city} ${date}`);
  // Toronto and New York keep the same clock across a whole year.
  for (let m = 0; m < 12; m++) {
    const d = new Date(Date.UTC(2026, m, 15));
    assert.equal(offsetMin(d, 'America/Toronto'), offsetMin(d, 'America/New_York'));
  }
});

test('every indexed city has a note, and only those', () => {
  const notes = JSON.parse(readFileSync('src/city-notes.json', 'utf8'));
  assert.deepEqual(Object.keys(notes).sort(), [...INDEXED_CITIES].sort());
});

test('worked examples in the flight calculator copy', () => {
  // New York 8:00 PM Jan 15 + 7h = London 8:00 AM next day.
  const a = new Date(wallToUtc(2026, 1, 15, 20, 0, 'America/New_York').getTime() + 7 * 3600000);
  assert.equal(hm24(a, 'Europe/London'), '08:00');
  assert.equal(ymdInTz(a, 'Europe/London').d, 16);
  // Tokyo 5:00 PM Jan 15 + 10h = Los Angeles 10:00 AM the same date.
  const b = new Date(wallToUtc(2026, 1, 15, 17, 0, 'Asia/Tokyo').getTime() + 10 * 3600000);
  assert.equal(hm24(b, 'America/Los_Angeles'), '10:00');
  assert.equal(ymdInTz(b, 'America/Los_Angeles').d, 15);
  // Madrid 10:00 to New York 12:30 in January is 8h 30m in the air.
  const mins = (wallToUtc(2026, 1, 15, 12, 30, 'America/New_York').getTime() - wallToUtc(2026, 1, 15, 10, 0, 'Europe/Madrid').getTime()) / 60000;
  assert.equal(mins, 510);
  // New York and London are 4 hours apart in mid-March 2026, 5 otherwise.
  assert.equal(off('2026-03-15T12:00:00Z', 'Europe/London') - off('2026-03-15T12:00:00Z', 'America/New_York'), 4);
  assert.equal(off('2026-04-15T12:00:00Z', 'Europe/London') - off('2026-04-15T12:00:00Z', 'America/New_York'), 5);
});

test('Discord styles and previews follow the official reference', () => {
  assert.deepEqual(STYLES.map((s) => s.code), ['t', 'T', 'd', 'D', 'f', 'F', 's', 'S', 'R']);
  const d = new Date('2021-04-20T16:20:30Z');
  const p = (c: string) => preview(d, c, 'en-GB', 'UTC', new Date('2025-04-20T16:20:30Z'));
  assert.equal(p('t'), '16:20');
  assert.equal(p('T'), '16:20:30');
  assert.equal(p('d'), '20/04/2021');
  assert.equal(p('s'), '20/04/2021, 16:20');
  assert.equal(p('S'), '20/04/2021, 16:20:30');
  assert.match(p('f'), /20 April 2021.*16:20/);
  assert.match(p('F'), /Tuesday.*20 April 2021.*16:20/);
  assert.equal(p('R'), '4 years ago');
  assert.equal(preview(new Date(Date.now() + 3 * 3600000 + 5000), 'R', 'en-US'), 'in 3 hours');
});

test('parseTimestamp reads codes and bare Unix times and rejects the rest', () => {
  assert.deepEqual(parseTimestamp('<t:1618935630:R>'), { date: new Date(1618935630000), style: 'R' });
  assert.equal(parseTimestamp(' <t:1618935630> ')?.style, 'f');
  assert.equal(parseTimestamp('1618935630')?.date.getTime(), 1618935630000);
  assert.equal(parseTimestamp('1618935630000')?.date.getTime(), 1618935630000);
  for (const bad of ['', 'hello', '<t:abc:R>', '<t:123:X>', '12:30']) assert.equal(parseTimestamp(bad), null, bad);
});

test('jet lag estimate uses CDC rates and the shorter way round the clock', () => {
  assert.deepEqual(estimate(-480, 660), { crossed: 5, east: false, days: 4, severity: 'moderate' }); // +19h = 5h west
  assert.deepEqual(estimate(-300, 60), { crossed: 6, east: true, days: 6, severity: 'severe' });
  assert.deepEqual(estimate(60, -300), { crossed: 6, east: false, days: 4, severity: 'severe' });
  assert.deepEqual(estimate(60, 60), { crossed: 0, east: false, days: 0, severity: 'none' });
});

test('jet lag plan moves bedtime in the right direction', () => {
  assert.deepEqual(preFlightBedtimes(6, true, 23 * 60), [22 * 60, 21 * 60, 20 * 60]);
  assert.deepEqual(preFlightBedtimes(1, false, 23 * 60), [0]);
  const east = dailyPlan(6, true, 23 * 60);
  assert.deepEqual(east[0], { day: 1, gap: 6, sleepy: 5 * 60 }); // body says 23:00 at 05:00 local
  assert.deepEqual(east[east.length - 1], { day: 7, gap: 0, sleepy: 23 * 60 });
  const west = dailyPlan(6, false, 23 * 60);
  assert.deepEqual(west[0], { day: 1, gap: 6, sleepy: 17 * 60 });
  assert.equal(west[west.length - 1].gap, 0);
});

// The January table in the meeting planner copy.
test('planner slots and the overlap examples in its copy', () => {
  const hoursFor = (tzs: string[]) => {
    const inst = Array.from({ length: 24 }, (_, h) => wallToUtc(2026, 1, 15, h, 0, tzs[0]));
    return inst.map((i) => tzs.map((tz) => Number(hm24(i, tz).slice(0, 2)) + Number(hm24(i, tz).slice(3)) / 60));
  };
  const count = (tzs: string[]) => findSlots(hoursFor(tzs)).all.length;
  assert.equal(count(['America/New_York', 'Europe/London']), 4);
  assert.equal(count(['Europe/Madrid', 'America/Mexico_City']), 2);
  assert.equal(count(['Europe/London', 'Asia/Singapore']), 1);
  assert.equal(count(['America/New_York', 'Asia/Dubai']), 0);
  assert.equal(count(['America/Los_Angeles', 'Asia/Kolkata']), 0);
  assert.equal(count(['America/New_York', 'Europe/London', 'Asia/Tokyo']), 0);

  // No shared hour: the closest slot still has most people in working hours.
  const { all, best } = findSlots(hoursFor(['America/New_York', 'Europe/London', 'Asia/Tokyo']));
  assert.equal(all.length, 0);
  assert.equal(best.inWork, 2);
});
