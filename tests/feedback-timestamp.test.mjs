import assert from 'node:assert/strict';
import test from 'node:test';
import { formatFeedbackTimestamp } from '../src/modules/feedback/feedbackTimestamp.ts';

test('feedback timestamps display the stored instant as an explicit date and time in IST', () => {
  assert.equal(
    formatFeedbackTimestamp('2026-11-09T05:11:00.000Z'),
    'Date: 09 Nov 2026 · Time: 10:41 AM IST',
  );
});

test('missing or invalid legacy feedback timestamps are not fabricated', () => {
  assert.equal(formatFeedbackTimestamp(undefined), 'Date/time unavailable');
  assert.equal(formatFeedbackTimestamp(''), 'Date/time unavailable');
  assert.equal(formatFeedbackTimestamp('not-a-date'), 'Date/time unavailable');
});
