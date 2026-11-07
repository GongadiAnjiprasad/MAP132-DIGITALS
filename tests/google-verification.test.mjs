import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('homepage contains the exact Google Search Console verification token', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(
    html.includes('<meta name="google-site-verification" content="ftTIw9QWeaYM4Mr8vn1BGzRf1gNQwLphHbcMeLD1h9Y" />'),
    'Google verification token must match the current Search Console property token',
  );
});
