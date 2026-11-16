export interface MovieOstEnv { YOUTUBE_API_KEY?: string; MAP132_KV?: KVNamespace }
type YouTubeSearchItem = { id?: { videoId?: string }; snippet?: { title?: string; description?: string; channelTitle?: string; channelId?: string; publishedAt?: string; thumbnails?: Record<string, { url?: string }> } };
type YouTubeVideoItem = { id?: string; contentDetails?: { duration?: string }; status?: { embeddable?: boolean } };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
function validPageToken(value: string | null) { return value && /^[A-Za-z0-9_=-]{1,512}$/.test(value) ? value : null; }
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

async function consumeRateLimit(request: Request, env: MovieOstEnv) {
  // Isolated preview has no production KV binding; keep it usable without touching production storage.
  if (!env.MAP132_KV) return { allowed: true, unavailable: false };
  const ip = (request.headers.get("CF-Connecting-IP") || "").trim();
  if (!ip || ip.length > 64) return { allowed: false, unavailable: true };
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const ipHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    const window = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
    const key = `movie-ost:rate:${ipHash}:${window}`;
    const current = Number(await env.MAP132_KV.get(key) || "0");
    if (!Number.isInteger(current) || current < 0) return { allowed: false, unavailable: true };
    if (current >= RATE_LIMIT_MAX) return { allowed: false, unavailable: false };
    await env.MAP132_KV.put(key, String(current + 1), { expirationTtl: 2 * 60 * 60 });
    return { allowed: true, unavailable: false };
  } catch {
    return { allowed: false, unavailable: true };
  }
}

export async function handleMovieOst(request: Request, env: MovieOstEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/resources/movie-ost" || request.method !== "GET") return null;
  const query = (url.searchParams.get("query") || "").trim().slice(0, 80);
  if (!query) return json({ results: [], nextPageToken: null });
  if (!env.YOUTUBE_API_KEY) return json({ error: "Movie OST search is not connected yet. Configure the YOUTUBE_API_KEY secret for the MAP132 Worker." }, 503);
  const pageToken = url.searchParams.get("pageToken");
  if (pageToken && !validPageToken(pageToken)) return json({ error: "Invalid results page token." }, 400);
  const rateLimit = await consumeRateLimit(request, env);
  if (!rateLimit.allowed) {
    return json(
      { error: rateLimit.unavailable ? "Movie OST search is temporarily unavailable because rate-limit storage is not ready." : "Too many Movie OST searches from this connection. Please try again in an hour." },
      rateLimit.unavailable ? 503 : 429,
    );
  }
  try {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.search = new URLSearchParams({
      part: "snippet", type: "video", videoEmbeddable: "true", maxResults: "24",
      regionCode: "IN", relevanceLanguage: "te", q: query + " original soundtrack BGM OST",
      key: env.YOUTUBE_API_KEY, ...(pageToken ? { pageToken } : {})
    }).toString();
    const searchResponse = await fetch(searchUrl, { headers: { Accept: "application/json" } });
    const searchData = await searchResponse.json() as { error?: { message?: string }; items?: YouTubeSearchItem[]; nextPageToken?: string };
    if (!searchResponse.ok) return json({ error: searchData.error?.message || "YouTube search is temporarily unavailable." }, searchResponse.status === 403 ? 503 : 502);
    const items = Array.isArray(searchData.items) ? searchData.items : [];
    const ids = items.map(item => item.id?.videoId).filter((id): id is string => !!id && /^[A-Za-z0-9_-]{11}$/.test(id));
    let details = new Map<string, YouTubeVideoItem>();
    if (ids.length) {
      const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      detailsUrl.search = new URLSearchParams({ part: "contentDetails,status", id: ids.join(","), key: env.YOUTUBE_API_KEY }).toString();
      const detailsResponse = await fetch(detailsUrl, { headers: { Accept: "application/json" } });
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json() as { items?: YouTubeVideoItem[] };
        details = new Map((detailsData.items || []).map(item => [String(item.id || ""), item]));
      }
    }
    const results = items.flatMap(item => {
      const id = item.id?.videoId;
      const snippet = item.snippet;
      if (!id || !snippet || details.get(id)?.status?.embeddable === false) return [];
      const thumbs = snippet.thumbnails || {};
      const thumbnail = thumbs.maxres?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || "";
      if (thumbnail && !/^https:\/\/(i\.ytimg\.com|img\.youtube\.com)\//.test(thumbnail)) return [];
      return [{
        videoId: id, title: String(snippet.title || "Untitled OST").slice(0, 300),
        channelTitle: String(snippet.channelTitle || "YouTube channel").slice(0, 160),
        channelId: String(snippet.channelId || ""), description: String(snippet.description || "").slice(0, 500),
        publishedAt: String(snippet.publishedAt || ""), thumbnail,
        duration: String(details.get(id)?.contentDetails?.duration || "")
      }];
    });
    return json({ results, nextPageToken: searchData.nextPageToken || null, query });
  } catch {
    return json({ error: "Could not reach YouTube right now. Please try again." }, 502);
  }
}
