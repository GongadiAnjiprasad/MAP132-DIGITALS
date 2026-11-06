import test from 'node:test';
import assert from 'node:assert/strict';
import {
  daysBetweenDateKeys,
  getFestivalCampaign,
  getIndiaDateKey,
  FESTIVAL_CAMPAIGN_DAYS
} from '../src/modules/seasonal/festivalCalendar.ts';

test('festival campaign starts exactly ten days before the event', () => {
  const campaign = getFestivalCampaign('2026-10-29');
  assert.equal(campaign?.festival.name, 'Diwali');
  assert.equal(campaign?.daysUntil, 10);
  assert.equal(campaign?.dayNumber, 1);
  assert.equal(campaign?.progress, 10);
});

test('festival campaign advances one creative beat each day', () => {
  const campaign = getFestivalCampaign('2026-11-06');
  assert.equal(campaign?.festival.name, 'Diwali');
  assert.equal(campaign?.daysUntil, 2);
  assert.equal(campaign?.dayNumber, 9);
  assert.equal(campaign?.currentDay?.focus, 'FESTIVAL TRAILER');
});

test('festival day switches to the grand reveal state', () => {
  const campaign = getFestivalCampaign('2026-11-08');
  assert.equal(campaign?.isFestivalDay, true);
  assert.equal(campaign?.daysUntil, 0);
  assert.equal(campaign?.currentDay, null);
  assert.equal(campaign?.progress, 100);
});

test('campaign is inactive more than ten days before or after a festival', () => {
  assert.equal(getFestivalCampaign('2026-10-28'), null);
  assert.equal(getFestivalCampaign('2026-11-09')?.festival.name, 'Chhath Puja');
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

test('campaign has ten editable creative beats', () => {
  assert.equal(FESTIVAL_CAMPAIGN_DAYS.length, 10);
});
