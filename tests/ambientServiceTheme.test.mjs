import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveServiceAccent, SERVICE_THEME_ACCENTS } from '../src/modules/ambient-service-themes/useAmbientServiceTheme.ts';

test('all six service themes use the approved accent colours', () => {
  assert.deepEqual(SERVICE_THEME_ACCENTS, {
    cinematic: '#FFCB78',
    celebrations: '#FFB45B',
    advertising: '#FFFFFF',
    ai: '#00F2FF',
    reels: '#BC13FE',
    youtube: '#FF0000',
  });
});

test('unknown or empty service keys safely fall back to Deep Navy', () => {
  assert.equal(resolveServiceAccent('unknown'), '#080D18');
  assert.equal(resolveServiceAccent(undefined), '#080D18');
});
