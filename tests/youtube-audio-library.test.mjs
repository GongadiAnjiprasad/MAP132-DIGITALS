import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("YouTube Audio Library shortcut is present in both mirrored workspace pages", async () => {
  const root = await readFile(new URL("../workspace.html", import.meta.url), "utf8");
  const publicCopy = await readFile(new URL("../public/workspace.html", import.meta.url), "utf8");
  assert.equal(root, publicCopy);
  assert.match(root, /data-resource-view="youtube-audio"/);
  assert.match(root, /data-resource-panel="youtube-audio"/);
  assert.match(root, /aria-label="YouTube Audio Library"/);
  assert.match(root, /<strong>YT Audio<\/strong>/);
});

test("YouTube Audio Library opens the official Studio library in a separate tab", async () => {
  const html = await readFile(new URL("../workspace.html", import.meta.url), "utf8");
  assert.match(html, /href="https:\/\/www\.youtube\.com\/audiolibrary" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /Open YouTube Audio Library/);
  assert.match(html, /Attribution not required/);
  assert.match(html, /copy its attribution text/);
  assert.match(html, /Download<\/b> to save the MP3/);
});

test("YouTube Audio Library panel explains import and licence boundaries without claiming MP3 redistribution rights", async () => {
  const html = await readFile(new URL("../workspace.html", import.meta.url), "utf8");
  assert.match(html, /My Drive/);
  assert.match(html, /private resource library for in-site preview/);
  assert.match(html, /not permission to redistribute the MP3 files publicly/);
  assert.match(html, /blanket guarantee for off-platform use/);
});
