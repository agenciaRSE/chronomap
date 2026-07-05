import { test } from 'node:test';
import assert from 'node:assert/strict';
import { icsStamp, googleCalUrl, icsDataUrl } from '../src/lib/calendar';

const START = new Date('2026-07-06T14:30:00Z');

test('icsStamp is the UTC basic ISO form', () => {
  assert.equal(icsStamp(START), '20260706T143000Z');
});

test('googleCalUrl encodes title + start/end range', () => {
  const url = googleCalUrl('Call — London / New York', START, 30, 'details');
  assert.match(url, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
  assert.ok(url.includes('dates=20260706T143000Z%2F20260706T150000Z'), url);
  assert.ok(url.includes('action=TEMPLATE'));
});

test('icsDataUrl produces a valid VEVENT with a 30-min duration', () => {
  const dataUrl = icsDataUrl('Team sync', START, 30, 'a, b');
  assert.ok(dataUrl.startsWith('data:text/calendar;charset=utf-8,'));
  const ics = decodeURIComponent(dataUrl.slice('data:text/calendar;charset=utf-8,'.length));
  assert.ok(ics.includes('BEGIN:VEVENT'));
  assert.ok(ics.includes('DTSTART:20260706T143000Z'));
  assert.ok(ics.includes('DTEND:20260706T150000Z'));
  assert.ok(ics.includes('SUMMARY:Team sync'));
  assert.ok(ics.includes('DESCRIPTION:a\\, b')); // comma escaped per RFC 5545
});
