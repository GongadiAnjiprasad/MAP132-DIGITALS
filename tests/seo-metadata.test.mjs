import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('homepage exposes descriptive MAP132 brand SEO metadata', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<title>MAP132 DIGITALS \| Cinematic Video Editing, Trailers &amp; Reels<\/title>/);
  assert.match(html, /name="description" content="MAP132 DIGITALS creates cinematic video edits/);
  assert.match(html, /name="robots" content="index, follow/);
  assert.match(html, /rel="canonical" href="https:\/\/map132-digitals\.anji-gongadi\.workers\.dev\/"\s*\/>/);
});

test('homepage structured data describes the website and its publisher organization', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'JSON-LD structured data must exist');
  const data = JSON.parse(match[1]);
  assert.equal(data['@context'], 'https://schema.org');
  assert.ok(data['@graph'].some((entry) => entry['@type'] === 'Organization' && entry.name === 'MAP132 DIGITALS'));
  assert.ok(data['@graph'].some((entry) => entry['@type'] === 'WebSite' && entry.name === 'MAP132 DIGITALS'));
});
