interface Env {
  ASSETS: Fetcher;
}

const demoContent = {
  profile: {
    name: "MAP132 DIGITALS",
    headline: "Your Creativity. Our Identity.",
    intro: "Cinematic Video Editing Portfolio · Stories shaped with rhythm, colour, motion and sound.",
    about: "A demo preview of the MAP132 DIGITALS creative portfolio. All projects shown here are sample visual placeholders, not client work.",
    location: "India",
    seasonalEffect: "none",
    whatsapp: "",
    instagram: "",
    youtube: "https://youtube.com/@map132digitals",
    email: "",
    facebook: "",
    telegram: "",
    linkedin: "",
  },
  skills: ["Cinematic Editing", "Colour Grading", "Motion Graphics", "Sound Design", "Storytelling"],
  logoPath: "",
  logoUrl: "/resources/Logo.webp",
  resources: [],
  items: [
    {
      id: "preview-cinematic",
      title: "The Final Frame",
      category: "Cinematic Trailers",
      description: "A cinematic mood study for trailers, teasers and dramatic storytelling.",
      kind: "image",
      mediaUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80",
      source: "other",
    },
    {
      id: "preview-wedding",
      title: "Forever in Frame",
      category: "Wedding / B’Day",
      description: "An elegant sample direction for wedding highlights and birthday films.",
      kind: "image",
      mediaUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
      source: "other",
    },
    {
      id: "preview-advertising",
      title: "Built to Be Seen",
      category: "Advertisements",
      description: "A polished commercial moodboard for product showcases and brand campaigns.",
      kind: "image",
      mediaUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80",
      source: "other",
    },
    {
      id: "preview-ai",
      title: "Future in Motion",
      category: "AI Services",
      description: "A futuristic visual direction for AI-assisted scenes and experimental edits.",
      kind: "image",
      mediaUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1000&q=80",
      source: "other",
    },
    {
      id: "preview-reels",
      title: "Make It Move",
      category: "Insta Reels",
      description: "A punchy short-form direction for vertical social videos and quick hooks.",
      kind: "image",
      mediaUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80",
      source: "other",
    },
    {
      id: "preview-youtube",
      title: "Beyond the Cut",
      category: "YouTube Related",
      description: "A creator-focused sample concept for videos, podcasts and channel edits.",
      kind: "image",
      mediaUrl: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1000&q=80",
      source: "other",
    },
  ],
};

const shell = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#080b12">
<title>MAP132 DIGITALS · Development Preview</title>
<style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;background:#080b12;color:#f5f2eb}
*{box-sizing:border-box}body{margin:0;min-width:320px;background:radial-gradient(ellipse at 12% 0%,#1b2940 0,transparent 42%),#080b12}
.top{position:sticky;top:0;z-index:5;border-bottom:1px solid #ffffff18;background:#0b101beF;backdrop-filter:blur(18px)}
.notice{padding:8px 16px;text-align:center;background:#ffcb78;color:#17120a;font-size:11px;font-weight:850;letter-spacing:.11em}
.head{max-width:1500px;margin:auto;padding:15px 24px;display:flex;align-items:center;justify-content:space-between;gap:18px}
.brand{display:flex;align-items:center;gap:12px;min-width:0}.brand img{width:46px;height:46px;object-fit:contain}.brand b{display:block;font-size:14px;letter-spacing:.16em}.brand small{display:block;margin-top:4px;color:#aebbd0;font-size:10px;letter-spacing:.08em}
.status{display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #ffffff24;border-radius:999px;color:#c9d5e7;font-size:11px;white-space:nowrap}.dot{width:7px;height:7px;border-radius:50%;background:#69d6a4;box-shadow:0 0 12px #69d6a4}
main{max-width:1500px;margin:auto;padding:22px 24px 26px}.intro{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:17px}.eyebrow{color:#ffcb78;font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.intro h1{margin:7px 0 5px;font-size:clamp(22px,3vw,32px);letter-spacing:-.04em}.intro p{margin:0;color:#aab6c8;font-size:13px;line-height:1.5}.controls{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.controls span{margin-right:5px;color:#91a0b6;font-size:11px}.controls button{border:1px solid #ffffff25;background:#111a29;color:#dce5f2;padding:9px 13px;border-radius:9px;font-size:11px;font-weight:750;cursor:pointer}.controls button[aria-pressed=true]{background:#ffcb78;border-color:#ffcb78;color:#17120a}.frame-wrap{min-height:520px;height:calc(100vh - 225px);max-height:1000px;overflow:hidden;border:1px solid #ffffff26;border-radius:16px;background:#151b25;box-shadow:0 24px 80px #0008;padding:12px;display:flex;justify-content:center;align-items:stretch}.frame{width:100%;height:100%;border:1px solid #ffffff2a;border-radius:8px;background:#101113;transition:width .25s ease;flex:0 0 auto}.frame.mobile{width:390px;max-width:100%;border-radius:28px;border:7px solid #222c3b}.frame.tablet{width:768px;max-width:100%;border-radius:18px;border:6px solid #222c3b}.foot{display:flex;justify-content:space-between;gap:12px;margin-top:11px;color:#8190a5;font-size:10px;line-height:1.5}.foot strong{color:#ffcb78;font-weight:700}
@media(max-width:700px){.head{padding:12px 14px}.brand img{width:38px;height:38px}.brand b{font-size:11px}.brand small{font-size:9px}.status{font-size:9px;padding:7px 9px}main{padding:18px 12px}.intro{display:block}.controls{margin-top:14px}.frame-wrap{height:calc(100vh - 255px);min-height:460px;padding:7px;border-radius:12px}.foot{display:block}.foot span{display:block;margin-top:4px}}
</style>
</head>
<body>
<header class="top">
  <div class="notice">MAP132 DIGITALS · DEVELOPMENT PREVIEW · NOT THE LIVE WEBSITE</div>
  <div class="head">
    <div class="brand"><img src="/resources/Logo.webp" alt="MAP132 DIGITALS"><div><b>MAP132 DIGITALS</b><small>YOUR CREATIVITY. OUR IDENTITY.</small></div></div>
    <div class="status"><i class="dot"></i> Isolated · Demo data · Read-only</div>
  </div>
</header>
<main>
  <section class="intro">
    <div><div class="eyebrow">Latest approved preview build · Isolated from production</div><h1>Cinematic Video Editing Portfolio</h1><p>Review the website at desktop, tablet and mobile sizes before any production change.</p></div>
    <div class="controls" role="group" aria-label="Preview viewport size"><span>VIEW AS</span><button type="button" data-mode="desktop" aria-pressed="true">Desktop</button><button type="button" data-mode="tablet" aria-pressed="false">Tablet</button><button type="button" data-mode="mobile" aria-pressed="false">Mobile</button></div>
  </section>
  <section class="frame-wrap" aria-label="Website preview"><iframe class="frame" id="site-preview" title="MAP132 DIGITALS website preview" src="/__map132_site_preview__/" allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe></section>
  <div class="foot"><span><strong>DEMO ONLY:</strong> sample projects and placeholder visuals are used. Your actual Drive files and private portfolio data are not loaded.</span><span>Changes here do not publish to the live website.</span></div>
</main>
<script>
const frame=document.getElementById('site-preview');
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
  const mode=button.dataset.mode;
  frame.className='frame'+(mode==='desktop'?'':' '+mode);
  document.querySelectorAll('[data-mode]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
}));
</script>
</body>
</html>`;

const previewBanner = `
  <div role="status" aria-label="Preview environment"
    style="position:sticky;top:0;z-index:2147483000;padding:8px 12px;text-align:center;
    background:#ffcb78;color:#17120a;font:800 11px/1.4 Arial,sans-serif;
    letter-spacing:.08em;box-shadow:0 2px 12px #0003">
    MAP132 DIGITALS · DEMO PREVIEW · NOT THE LIVE WEBSITE
  </div>`;

function blockedResponse(): Response {
  return Response.json(
    { error: "Preview mode: this action is disabled.", mode: "demo-only", readOnly: true },
    { status: 503, headers: { "Cache-Control": "no-store", "X-MAP132-Preview": "isolated" } },
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/portfolio" && request.method === "GET") {
      return Response.json(
        { content: demoContent },
        { headers: { "Cache-Control": "no-store", "X-MAP132-Preview": "demo-data" } },
      );
    }
    if (url.pathname === "/api/reviews" && request.method === "GET") {
      // Only read the production endpoint's already-public, consent-approved reviews.
      // The preview has no KV binding and cannot read private feedback or mutate records.
      try {
        const upstream = await fetch("https://map132-digitals.anji-gongadi.workers.dev/api/reviews", {
          method: "GET",
          headers: { "Accept": "application/json" },
        });
        if (!upstream.ok) throw new Error("Public reviews endpoint unavailable");
        const payload = await upstream.json() as { reviews?: unknown };
        return Response.json(
          { reviews: Array.isArray(payload.reviews) ? payload.reviews : [] },
          { headers: { "Cache-Control": "no-store", "X-MAP132-Preview": "public-reviews-readonly" } },
        );
      } catch {
        return Response.json(
          { reviews: [], previewReviewsUnavailable: true },
          { headers: { "Cache-Control": "no-store", "X-MAP132-Preview": "public-reviews-unavailable" } },
        );
      }
    }
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/media/")) {
      return blockedResponse();
    }

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(shell, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-MAP132-Preview": "isolated",
        },
      });
    }

    const assetUrl = new URL(url);
    const isEmbeddedSite = url.pathname === "/__map132_site_preview__/" || url.pathname === "/__map132_site_preview__";
    if (isEmbeddedSite) assetUrl.pathname = "/index.html";
    const assetRequest = new Request(assetUrl.toString(), request);
    const response = await env.ASSETS.fetch(assetRequest);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return response;

    const rewriter = new HTMLRewriter();
    if (isEmbeddedSite) {
      rewriter.on("head", {
        element(element) {
          element.append(`<style>
            /* Preview-only normal document flow: avoid layers covering text while scrolling. */
            html { scroll-behavior: auto !important; scroll-padding-top: 12px !important; }
            html, body { overflow-x: hidden !important; overflow-y: auto !important; height: auto !important; }
            #root, .site { height: auto !important; min-height: 0 !important; overflow: visible !important; }
            .nav { position: relative !important; top: auto !important; z-index: 2 !important; }
            .website-intro, .royal-intro { display: none !important; pointer-events: none !important; }
            /* Keep the site's own hash-based page routing intact. The previous
               preview override forced every section visible, stacking page views
               and making the selected Work content appear to overlap on scroll. */
            .site { overflow: visible !important; }
            .site main > section:target { animation: none !important; transform: none !important; }
            [id], section { scroll-margin-top: 12px !important; }
          </style>`, { html: true });
        },
      });
    } else {
      rewriter.on("body", {
        element(element) {
          element.prepend(previewBanner, { html: true });
        },
      });
    }
    return rewriter.transform(response);
  },
};
