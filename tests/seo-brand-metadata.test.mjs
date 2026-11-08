import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
assert.ok(jsonLdMatch, 'homepage must contain its JSON-LD graph');
const graph = JSON.parse(jsonLdMatch[1]);
const websiteNodes = graph['@graph'].filter((node) => node['@type'] === 'WebSite');
const organizationNodes = graph['@graph'].filter((node) => node['@type'] === 'Organization');
const expectedAliases = [
  'MAP132 ANJI DIGITALS',
  'ANJI MAP132 DIGITALS',
  'MAP132 Digitals',
  'map132digitals'
];

test('homepage preserves one canonical MAP132 DIGITALS WebSite identity', () => {
  assert.equal(websiteNodes.length, 1);
  assert.equal(websiteNodes[0].name, 'MAP132 DIGITALS');
  assert.equal(websiteNodes[0].url, 'https://map132-digitals.anji-gongadi.workers.dev/');
  assert.equal(organizationNodes.length, 1);
  assert.equal(organizationNodes[0].name, 'MAP132 DIGITALS');
});

test('homepage exposes the approved Anji and MAP132 brand aliases', () => {
  for (const node of [...websiteNodes, ...organizationNodes]) {
    assert.deepEqual(node.alternateName, expectedAliases);
  }
  assert.match(html, /MAP132 DIGITALS by Anji/);
});

test('homepage keeps its existing production canonical URL and Google indexing directives', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/map132-digitals\.anji-gongadi\.workers\.dev\/"\s*\/>/);
  assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large"/);
});
