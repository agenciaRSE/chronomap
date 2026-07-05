import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offsetMin, hm24, ymdInTz, hourInTz, timeLabel, dayLabel, wallToUtc } from '../src/lib/tz';

// Fixed instants (UTC) so results are deterministic regardless of when tests run.
const SUMMER = new Date('2026-07-06T12:00:00Z'); // northern-hemisphere DST active
const WINTER = new Date('2026-01-15T12:00:00Z');

test('offsetMin handles DST, zero and half-hour offsets', () => {
  assert.equal(offsetMin(SUMMER, 'Europe/London'), 60); // BST
  assert.equal(offsetMin(WINTER, 'Europe/London'), 0); // GMT
  assert.equal(offsetMin(SUMMER, 'America/New_York'), -240); // EDT
  assert.equal(offsetMin(WINTER, 'America/New_York'), -300); // EST
  assert.equal(offsetMin(SUMMER, 'Asia/Kolkata'), 330); // +5:30
  assert.equal(offsetMin(SUMMER, 'Asia/Kathmandu'), 345); // +5:45
});

test('hm24 / hourInTz read the local hour', () => {
  // 12:00 UTC in London summer = 13:00 BST
  assert.equal(hm24(SUMMER, 'Europe/London'), '13:00');
  assert.equal(hourInTz(SUMMER, 'Europe/London'), 13);
  // 12:00 UTC = 08:00 EDT New York
  assert.equal(hourInTz(SUMMER, 'America/New_York'), 8);
});

test('ymdInTz gives the local calendar day (1-based month)', () => {
  // 12:00 UTC Jul 6 = still Jul 6 in Tokyo (21:00)
  assert.deepEqual(ymdInTz(SUMMER, 'Asia/Tokyo'), { y: 2026, mo: 7, d: 6 });
  // but next day in a far-east instant near midnight UTC
  const lateUTC = new Date('2026-07-06T22:00:00Z');
  assert.deepEqual(ymdInTz(lateUTC, 'Asia/Tokyo'), { y: 2026, mo: 7, d: 7 });
});

test('wallToUtc: converter cases are DST-correct', () => {
  // 3pm New York (summer, EDT-4) -> 19:00 UTC -> 04:00 next day Tokyo (+9)
  const ny3pm = wallToUtc(2026, 7, 6, 15, 0, 'America/New_York');
  assert.equal(ny3pm.toISOString(), '2026-07-06T19:00:00.000Z');
  assert.equal(hm24(ny3pm, 'Asia/Tokyo'), '04:00');
  assert.equal(ymdInTz(ny3pm, 'Asia/Tokyo').d, 7); // next day

  // 3pm New York in winter (EST-5) -> 20:00 UTC
  const ny3pmWinter = wallToUtc(2026, 1, 15, 15, 0, 'America/New_York');
  assert.equal(ny3pmWinter.toISOString(), '2026-01-15T20:00:00.000Z');

  // 9am London (summer BST+1) -> 08:00 UTC -> 04:00 EDT New York, same day
  const ldn9am = wallToUtc(2026, 7, 6, 9, 0, 'Europe/London');
  assert.equal(hm24(ldn9am, 'America/New_York'), '04:00');
});

test('timeLabel / dayLabel format for humans', () => {
  const t = wallToUtc(2026, 7, 6, 15, 0, 'Europe/London'); // 15:00 BST
  assert.equal(timeLabel(t, 'Europe/London'), '3:00 PM');
  assert.equal(dayLabel(t, 'Europe/London'), 'Mon, Jul 6');
});
