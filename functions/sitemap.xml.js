export async function onRequest({ request }) {
  const BASE_URL = "https://indfodsretsprove.dk";

  // 1) Core static pages
  const STATIC_URLS = [
    "/",
    "/kontakt/",
    "/om-proeven/",
    "/gratis-prove/",
    "/find-dit-testcenter/"
  ];

  // 2) Section hubs
  const SECTION_URLS = [
    "/demokrati/",
    "/historie/",
    "/kulturliv/",
    "/oekonomi/",
    "/temaopslag/",
    "/danmark-og-omverdenen/",
    "/forbered-dig/",
    "/test-centre/"
  ];

  // 3) Articles (from existing JSON)
  let articleUrls = [];
  try {
    const jsonUrl = new URL("/artikler/articles.json", request.url);
    const res = await fetch(jsonUrl);
    if (res.ok) {
      const data = await res.json();
      articleUrls = data.map(a => a.url).filter(Boolean);
    }
  } catch (_) {}

  // 4) Test centres (explicit list)
  let centreUrls = [];
  try {
    const centresUrl = new URL("/test-centre/centres.json", request.url);
    const res = await fetch(centresUrl);
    if (res.ok) {
      const centres = await res.json();
      centreUrls = centres
        .map(c => `/test-centre/${c.slug}/`)
        .filter(Boolean);
    }
  } catch (_) {}

  const urls = [
    ...STATIC_URLS,
    ...SECTION_URLS,
    ...articleUrls,
    ...centreUrls
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(path => `
  <url>
    <loc>${BASE_URL}${path}</loc>
  </url>`).join("")}
</urlset>`;

  return new Response(body.trim(), {
    headers: { "content-type": "application/xml; charset=utf-8" }
  });
}
