import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextOccurrence } from '../src/lib/reminders';

test('nextOccurrence is today when the time is still ahead', () => {
  const now = new Date(2026, 10, 21, 9, 15, 30);
  assert.deepEqual(nextOccurrence('18:00', now), new Date(2026, 10, 21, 18, 0, 0));
});

test('nextOccurrence rolls to tomorrow when the minute has passed', () => {
  const now = new Date(2026, 10, 21, 9, 15, 30);
  assert.deepEqual(nextOccurrence('09:15', now), new Date(2026, 10, 22, 9, 15, 0));
  assert.deepEqual(nextOccurrence('08:00', now), new Date(2026, 10, 22, 8, 0, 0));
});
