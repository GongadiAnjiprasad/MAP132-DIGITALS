import test from 'node:test';
import assert from 'node:assert/strict';
import {
  daysBetweenDateKeys,
  getFestivalCampaign,
  getIndiaDateKey
} from '../src/modules/seasonal/festivalCalendar.ts';

test('subtle seasonal effect starts ten days before the configured festival', () => {
  const campaign = getFestivalCampaign('2026-10-29');
  assert.equal(campaign?.festival.name, 'Diwali');
  assert.equal(campaign?.daysUntil, 10);
  assert.equal(campaign?.isFestivalDay, false);
});

test('the festival greeting is active on the configured festival date only', () => {
  const campaign = getFestivalCampaign('2026-11-08');
  assert.equal(campaign?.isFestivalDay, true);
  assert.equal(campaign?.daysUntil, 0);
});

test('the previous festival greeting does not remain after its date', () => {
  const campaign = getFestivalCampaign('2026-11-09');
  assert.equal(campaign?.festival.name, 'Chhath Puja');
  assert.equal(campaign?.isFestivalDay, false);
});

test('seasonal effect is inactive outside all ten-day pre-festival windows', () => {
  assert.equal(getFestivalCampaign('2026-10-28'), null);
  assert.equal(getFestivalCampaign('2026-12-26'), null);
});

test('the nearest eligible festival wins when windows overlap', () => {
  const campaign = getFestivalCampaign('2026-11-10');
  assert.equal(campaign?.festival.name, 'Chhath Puja');
});

test('India date calculation uses Asia/Kolkata rather than the device timezone', () => {
  assert.equal(getIndiaDateKey(new Date('2026-11-05T19:00:00.000Z')), '2026-11-06');
});

test('date arithmetic rejects invalid dates and handles day boundaries', () => {
  assert.equal(daysBetweenDateKeys('2026-11-06', '2026-11-08'), 2);
  assert.equal(daysBetweenDateKeys('2026-02-30', '2026-03-01'), null);
  assert.equal(daysBetweenDateKeys('not-a-date', '2026-03-01'), null);
});
