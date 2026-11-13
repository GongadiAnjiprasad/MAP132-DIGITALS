interface Env {
  ASSETS: Fetcher;
}

const previewBanner = `
  <div role="status" aria-label="Preview environment"
    style="position:sticky;top:0;z-index:2147483000;padding:9px 14px;text-align:center;
    background:#ffcb78;color:#17120a;font:700 12px/1.4 Arial,sans-serif;
    letter-spacing:.04em;box-shadow:0 2px 12px #0003">
    MAP132 DIGITALS · PRIVATE PREVIEW · DEMO ONLY · NOT THE LIVE WEBSITE
  </div>`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/media/")) {
      return Response.json(
        {
          error: "Preview mode: backend and media storage are disabled.",
          mode: "demo-only",
          readOnly: true,
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
            "X-MAP132-Preview": "isolated",
          },
        },
      );
    }

    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return response;

    return new HTMLRewriter()
      .on("body", {
        element(element) {
          element.prepend(previewBanner, { html: true });
        },
      })
      .transform(response);
  },
};
