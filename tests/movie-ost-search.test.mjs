import test from "node:test";
import assert from "node:assert/strict";
import { handleMovieOst } from "../worker/movieOst.ts";

test("movie OST route ignores unrelated paths and methods", async () => {
  assert.equal(await handleMovieOst(new Request("https://map132.test/api/resources/sounds"), {}), null);
  assert.equal(await handleMovieOst(new Request("https://map132.test/api/resources/movie-ost", { method: "POST" }), {}), null);
});

test("movie OST route requires a configured YouTube API key", async () => {
  const response = await handleMovieOst(new Request("https://map132.test/api/resources/movie-ost?query=Baahubali"), {});
  assert.equal(response?.status, 503);
  const payload = await response.json();
  assert.match(payload.error, /YOUTUBE_API_KEY/);
});

test("movie OST route validates page tokens before calling YouTube", async () => {
  const response = await handleMovieOst(new Request("https://map132.test/api/resources/movie-ost?query=Baahubali&pageToken=bad%20token"), { YOUTUBE_API_KEY: "test-key" });
  assert.equal(response?.status, 400);
});

test("movie OST search enforces ten requests per IP per hour and stores only a hashed IP key", async () => {
  const values = new Map();
  const kv = {
    get: async key => values.get(key) ?? null,
    put: async (key, value, options) => {
      assert.equal(options.expirationTtl, 7200);
      values.set(key, value);
    },
  };
  const originalFetch = globalThis.fetch;
  let apiCalls = 0;
  globalThis.fetch = async () => {
    apiCalls++;
    return new Response(JSON.stringify({ items: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const request = () => new Request("https://map132.test/api/resources/movie-ost?query=Baahubali", { headers: { "CF-Connecting-IP": "203.0.113.7" } });
    for (let i = 0; i < 10; i++) assert.equal((await handleMovieOst(request(), { YOUTUBE_API_KEY: "test-key", MAP132_KV: kv }))?.status, 200);
    const blocked = await handleMovieOst(request(), { YOUTUBE_API_KEY: "test-key", MAP132_KV: kv });
    assert.equal(blocked?.status, 429);
    assert.equal(apiCalls, 10);
    assert.equal(values.size, 1);
    assert.equal(values.values().next().value, "10");
    assert.ok([...values.keys()].every(key => !key.includes("203.0.113.7")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("movie OST search fails closed when configured rate-limit storage is unavailable", async () => {
  const originalFetch = globalThis.fetch;
  let apiCalls = 0;
  globalThis.fetch = async () => {
    apiCalls++;
    throw new Error("External request must not run");
  };
  try {
    const response = await handleMovieOst(
      new Request("https://map132.test/api/resources/movie-ost?query=Baahubali", { headers: { "CF-Connecting-IP": "203.0.113.7" } }),
      { YOUTUBE_API_KEY: "test-key", MAP132_KV: { get: async () => { throw new Error("KV unavailable"); }, put: async () => {} } },
    );
    assert.equal(response?.status, 503);
    assert.equal(apiCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("movie OST search remains usable in an isolated preview without a production KV binding", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ items: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
  try {
    const response = await handleMovieOst(new Request("https://map132.test/api/resources/movie-ost?query=Baahubali"), { YOUTUBE_API_KEY: "test-key" });
    assert.equal(response?.status, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

