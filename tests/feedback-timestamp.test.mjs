import assert from 'node:assert/strict';
import test from 'node:test';
import { formatFeedbackTimestamp } from '../src/modules/feedback/feedbackTimestamp.ts';

const now = new Date('2026-11-09T10:41:00.000+05:30');

test('feedback timestamps use compact relative labels during the same IST day', () => {
  assert.equal(formatFeedbackTimestamp('2026-11-09T10:40:50.000+05:30', now), 'Just now');
  assert.equal(formatFeedbackTimestamp('2026-11-09T10:40:00.000+05:30', now), '1 minute ago');
  assert.equal(formatFeedbackTimestamp('2026-11-09T10:36:00.000+05:30', now), '5 minutes ago');
  assert.equal(formatFeedbackTimestamp('2026-11-09T09:41:00.000+05:30', now), '1 hour ago');
  assert.equal(formatFeedbackTimestamp('2026-11-09T08:41:00.000+05:30', now), '2 hours ago');
});

test('after the IST calendar day changes, timestamps show the compact date', () => {
  assert.equal(formatFeedbackTimestamp('2026-11-08T23:55:00.000+05:30', now), '8 Nov 2026');
});

test('missing or invalid legacy feedback timestamps are not fabricated', () => {
  assert.equal(formatFeedbackTimestamp(undefined, now), 'Date/time unavailable');
  assert.equal(formatFeedbackTimestamp('', now), 'Date/time unavailable');
  assert.equal(formatFeedbackTimestamp('not-a-date', now), 'Date/time unavailable');
});
