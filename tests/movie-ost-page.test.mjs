import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("movie OST page uses YouTube thumbnails and in-page embeds without external search navigation", async () => {
  const html = await readFile(new URL("../public/movie-bgm.html", import.meta.url), "utf8");
  assert.match(html, /youtube-nocookie\.com\/embed\//);
  assert.match(html, /item\.thumbnail/);
  assert.match(html, /\/api\/resources\/movie-ost/);
  assert.doesNotMatch(html, /youtube\.com\/results\?search_query/);
  assert.doesNotMatch(html, /target="_blank"/);
});

test("movie OST page does not expose an unauthorized YouTube download action", async () => {
  const html = await readFile(new URL("../public/movie-bgm.html", import.meta.url), "utf8");
  assert.match(html, /YouTube-hosted content cannot be downloaded/);
  assert.match(html, /Download unavailable/);
});
