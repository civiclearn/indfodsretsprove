export async function onRequest({ request }) {
  const BASE_URL = "https://indfodsretsprove.dk";
  let urls = [];

  // 1) Content registry (pages, hubs, articles)
  try {
    const registryUrl = new URL("/data/content-registry.json", request.url);
    const res = await fetch(registryUrl);
    if (res.ok) {
      const data = await res.json();
      const now = new Date();

      urls.push(
        ...data
          .filter(item => {
            if (!item.url) return false;
            if (!item.publish_at) return true;
            return new Date(item.publish_at) <= now;
          })
          .map(item => item.url)
      );
    }
  } catch (_) {}

  // 2) Test centres (separate source)
  try {
    const centresUrl = new URL("/test-centre/centres.json", request.url);
    const res = await fetch(centresUrl);
    if (res.ok) {
      const centres = await res.json();
      urls.push(
        ...centres
          .map(c => `/test-centre/${c.slug}/`)
          .filter(Boolean)
      );
    }
  } catch (_) {}

  // de-duplicate
  urls = [...new Set(urls)];

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
