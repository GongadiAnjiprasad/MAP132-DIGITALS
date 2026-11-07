import { test, expect } from '@playwright/test';

async function installAudioMocks(page: import('@playwright/test').Page, hasAudioTrack = true) {
  await page.addInitScript(({ hasAudioTrack }) => {
    class FakeAnalyser {
      fftSize = 256;
      frequencyBinCount = 128;
      smoothingTimeConstant = 0.72;
      getByteFrequencyData(data: Uint8Array) {
        data.fill(0);
        data.fill(240, 1, 7);
        data.fill(150, 7, 30);
        data.fill(90, 30, 90);
      }
    }
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: class {
        destination = { connect() {} };
        createAnalyser() { return new FakeAnalyser(); }
        createMediaStreamSource() { return { connect() {} }; }
        createGain() { return { gain: { value: 1 }, connect() {} }; }
        createOscillator() { return { type: 'sine', frequency: { value: 440 }, connect() {}, start() {}, stop() {} }; }
        resume() { return Promise.resolve(); }
        close() { return Promise.resolve(); }
      }
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'captureStream', {
      configurable: true,
      value() { return { getAudioTracks: () => hasAudioTrack ? [{}] : [] }; }
    });
  }, { hasAudioTrack });
}

async function startMockPlayback(video: import('@playwright/test').Locator) {
  await video.evaluate(element => {
    Object.defineProperty(element, 'paused', { configurable: true, get: () => false });
    Object.defineProperty(element, 'ended', { configurable: true, get: () => false });
    element.dispatchEvent(new Event('play'));
  });
}

async function stopMockPlayback(video: import('@playwright/test').Locator) {
  await video.evaluate(element => {
    Object.defineProperty(element, 'paused', { configurable: true, get: () => true });
    element.dispatchEvent(new Event('pause'));
  });
}

test('desktop audio drives the gold and teal wave layers and pause calms them', async ({ page }) => {
  await installAudioMocks(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).click();
  const video = page.locator('.studio-reel-media video').first();
  await expect(video).toHaveCount(1);
  await startMockPlayback(video);
  const site = page.locator('.map132-slider-site');
  await expect.poll(() => site.evaluate(element => Number(getComputedStyle(element).getPropertyValue('--ms-audio-bass-scale')))).toBeGreaterThan(1);
  await expect.poll(() => site.evaluate(element => Number(getComputedStyle(element).getPropertyValue('--ms-audio-wave-opacity')))).toBeGreaterThan(.34);
  const waveLayer = page.locator('.ms-page').nth(1);
  await expect.poll(() => waveLayer.evaluate(element => getComputedStyle(element, '::after').backgroundImage.includes('data:image/svg+xml'))).toBe(true);
  await stopMockPlayback(video);
  await expect.poll(() => site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-audio-bass-scale').trim())).toBe('1');
  await expect.poll(() => site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-audio-wave-opacity').trim())).toBe('.34');
});

test('mobile audio-reactive waves stay within the viewport and reset on pause', async ({ page }) => {
  await installAudioMocks(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).tap();
  const video = page.locator('.studio-reel-media video').first();
  await expect(video).toHaveCount(1);
  await startMockPlayback(video);
  const site = page.locator('.map132-slider-site');
  await expect.poll(() => site.evaluate(element => Number(getComputedStyle(element).getPropertyValue('--ms-audio-bass-scale')))).toBeGreaterThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(392);
  await stopMockPlayback(video);
  await expect.poll(() => site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-audio-wave-opacity').trim())).toBe('.34');
});

test('silent demo clip receives the original genre sound bed and keeps waves visible', async ({ page }) => {
  await installAudioMocks(page, false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).tap();
  const video = page.locator('.studio-reel-media video').first();
  await expect(video).toHaveCount(1);
  await startMockPlayback(video);
  const site = page.locator('.map132-slider-site');
  await expect.poll(() => site.evaluate(element => Number(getComputedStyle(element).getPropertyValue('--ms-audio-wave-opacity')))).toBeGreaterThan(.34);
  await expect.poll(() => site.evaluate(element => Number(getComputedStyle(element).getPropertyValue('--ms-audio-bass-scale')))).toBeGreaterThan(1);
  await stopMockPlayback(video);
  await expect.poll(() => site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-audio-wave-opacity').trim())).toBe('.34');
});
