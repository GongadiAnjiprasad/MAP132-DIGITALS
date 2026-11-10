import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');

test('homepage exposes accurate, indexable MAP132 studio metadata', () => {
  assert.match(html, /<title>MAP132 DIGITALS \| Cinematic Video Editing Studio<\/title>/);
  assert.match(html, /<meta name="description" content="MAP132 DIGITALS/);
  assert.match(html, /<meta name="robots" content="index, follow/);
  assert.match(html, /<link rel="canonical" href="https:\/\/map132-digitals\.anji-gongadi\.workers\.dev\/" \/>/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:image"/);
});

test('structured data describes the actual six video-editing services', () => {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'JSON-LD script should exist');
  const graph = JSON.parse(match[1]).['@graph'];
  const organization = graph.find((entry) => entry['@type'] === 'Organization');
  assert.ok(organization);
  const offers = organization.hasOfferCatalog.itemListElement;
  const names = offers.map((offer) => offer.itemOffered.name);
  assert.deepEqual(names, [
    'Cinematic Trailers',
    'Wedding / B’Day',
    'Advertisements',
    'AI Services',
    'Insta Reels',
    'YouTube Related'
  ]);
  assert.ok(organization.knowsAbout.some((topic) => topic.includes('video editing')));
});

test('robots and sitemap point to the canonical production hostname', () => {
  assert.match(robots, /User-agent: \*\s+Allow: \/[\s\S]*Sitemap: https:\/\/map132-digitals\.anji-gongadi\.workers\.dev\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/map132-digitals\.anji-gongadi\.workers\.dev\/<\/loc>/);
});
