import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('critical showcase image is preloaded at the exact optimized URL', () => {
  const html = read('../index.html');
  const showcase = read('../src/demoShowcase.ts');
  const sourceUrl = 'photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=720&q=72';
  const htmlUrl = 'photo-1519608487953-e999c86e7455?auto=format&amp;fit=crop&amp;w=720&amp;q=72';
  assert.ok(html.includes(htmlUrl));
  assert.ok(showcase.includes(sourceUrl));
});

test('showcase photos use reduced delivery dimensions and quality', () => {
  const source = read('../src/demoShowcase.ts');
  assert.equal(source.split('w=720&q=72').length - 1, 8);
  assert.ok(!source.includes('w=1100&q=85'));
});

test('service tiles use image elements with eager high priority for the LCP candidate', () => {
  const source = read('../src/HomeSlider.tsx');
  assert.ok(source.includes('<img src={card.image}'));
  assert.ok(source.includes("loading={index === 0 ? 'eager' : 'lazy'}"));
  assert.ok(source.includes("fetchPriority={index === 0 ? 'high' : 'auto'}"));
});

test('brand logo uses generated transparent WebP while retaining PNG fallback', () => {
  const app = read('../src/App.tsx');
  const slider = read('../src/HomeSlider.tsx');
  const workflow = read('../.github/workflows/deploy.yml');
  assert.ok(app.includes("DEFAULT_BRAND_LOGO = '/resources/Logo.webp'"));
  assert.ok(app.includes("LEGACY_BRAND_LOGO = '/resources/Logo.png'"));
  assert.ok(slider.includes('/resources/Logo.webp'));
  assert.ok(workflow.includes('sharp-cli@6.1.0'));
  assert.ok(workflow.includes('test -s public/resources/Logo.webp'));
});

test('feedback launcher reveal avoids animated layout and paint-heavy properties', () => {
  const css = read('../src/index.css');
  const start = css.indexOf('/* MAP132 Royal Gold feedback launcher');
  const end = css.indexOf('/*', start + 10);
  const block = css.slice(start, end < 0 ? undefined : end);
  assert.ok(!block.includes('animation:royal-feedback-glow'));
  assert.ok(!block.includes('transition:width'));
  assert.ok(!block.includes('transition:max-width'));
  assert.ok(!block.includes('transition:box-shadow'));
  assert.ok(block.includes('clip-path:'));
});

test('font CSS is non-blocking and the LCP image has an early connection and preload', () => {
  const html = read('../index.html');
  const css = read('../src/index.css');
  assert.ok(html.includes('href="https://images.unsplash.com"'));
  assert.ok(html.includes('rel="preload" as="image"'));
  assert.ok(html.includes('rel="preload" as="style"'));
  assert.ok(!css.includes('@import url(\'https://fonts.googleapis.com'));
});
test('SVG and HTML favicon references use the optimized logo, not the 3.5 MB PNG', () => {
  const favicon = read('../public/favicon.svg');
  const html = read('../index.html');
  assert.ok(favicon.includes('/resources/Logo.webp'));
  assert.ok(!favicon.includes('/resources/Logo.png'));
  assert.ok(html.includes('type="image/webp" href="/resources/Logo.webp"'));
});
