import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offsetMin, hm24, ymdInTz, hourInTz, timeLabel, dayLabel, wallToUtc, dayDelta, utcLabel } from '../src/lib/tz';

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

test('wallToUtc resolves wall times close to a DST change', () => {
  // Sydney leaves DST at 16:00 UTC on 2026-04-04 (03:00 local on the 5th). 01:00 local is
  // still +11, even though 01:00 read as UTC falls after the change.
  assert.equal(wallToUtc(2026, 4, 5, 1, 0, 'Australia/Sydney').toISOString(), '2026-04-04T14:00:00.000Z');
  assert.equal(wallToUtc(2026, 4, 5, 9, 0, 'Australia/Sydney').toISOString(), '2026-04-04T23:00:00.000Z');
  // New York's change is at 06:00 UTC on 2026-11-01; 03:00 local read as UTC falls before it.
  assert.equal(wallToUtc(2026, 11, 1, 3, 0, 'America/New_York').toISOString(), '2026-11-01T08:00:00.000Z');
});

test('dayDelta and utcLabel describe a conversion', () => {
  // 9:00 PM PST = 05:00 UTC next day = 2:00 PM JST next day.
  const i = wallToUtc(2026, 1, 15, 21, 0, 'America/Los_Angeles');
  assert.equal(hm24(i, 'Asia/Tokyo'), '14:00');
  assert.equal(dayDelta(i, 'America/Los_Angeles', 'Asia/Tokyo'), 1);
  assert.equal(dayDelta(i, 'Asia/Tokyo', 'America/Los_Angeles'), -1);
  // 2:00 PM AEST (winter in Sydney, no DST) = 12:00 PM SGT.
  assert.equal(hm24(wallToUtc(2026, 7, 6, 14, 0, 'Australia/Sydney'), 'Asia/Singapore'), '12:00');
  assert.equal(utcLabel(-240), 'UTC−4');
  assert.equal(utcLabel(330), 'UTC+5:30');
  assert.equal(utcLabel(0), 'UTC+0');
});
