import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('homepage exposes MAP132 brand SEO metadata without hosting-provider branding', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<title>MAP132 DIGITALS \| Cinematic Video Editing Studio<\/title>/);
  assert.match(html, /name="description" content="MAP132 DIGITALS — cinematic video editing for trailers, wedding and birthday films, advertisements, AI services, Instagram Reels and YouTube content\."\s*\/>/);
  assert.match(html, /property="og:title" content="MAP132 DIGITALS \| Cinematic Video Editing Studio"/);
  assert.match(html, /name="twitter:title" content="MAP132 DIGITALS \| Cinematic Video Editing Studio"/);
  assert.match(html, /name="application-name" content="MAP132 DIGITALS"/);
  assert.match(html, /rel="icon" type="image\/svg\+xml" href="\/favicon\.svg"/);
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
  const organization = data['@graph'].find((entry) => entry['@type'] === 'Organization');
  const website = data['@graph'].find((entry) => entry['@type'] === 'WebSite');
  assert.equal(website.name, 'MAP132 DIGITALS');
  for (const alias of ['MAP 132 DIGITALS', 'MAP132 DIGITALS', 'MAP132', 'MAP 132', 'map132 digitals', 'map132digitals', 'MAP132-DIGITALS']) {
    assert.ok(organization.alternateName.includes(alias), `Organization alias should include ${alias}`);
    assert.ok(website.alternateName.includes(alias), `Website alias should include ${alias}`);
  }
});
