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
  assert.match((await response!.json()).error, /YOUTUBE_API_KEY/);
});

test("movie OST route validates page tokens before calling YouTube", async () => {
  const response = await handleMovieOst(new Request("https://map132.test/api/resources/movie-ost?query=Baahubali&pageToken=bad%20token"), { YOUTUBE_API_KEY: "test-key" });
  assert.equal(response?.status, 400);
});
