---
"@kaiord/landing": patch
"@kaiord/workout-spa-editor": patch
---

Optimize the site for AI agents and answer engines (GEO). Add a curated root
`llms.txt` pointing at the product pages and the docs markdown corpus, stop
blocking `/editor/` in `robots.txt`, and replace the root sitemap with a
sitemap index covering the landing (with hreflang alternates), the editor,
and the VitePress docs sitemap (which now stays at `/docs/sitemap.xml`).
Enrich the editor shell for non-JS crawlers: descriptive title and meta
description, `WebApplication` JSON-LD with a feature list, and `noscript`
content linking back to the landing and docs. Add a `WebSite` node to the
landing JSON-LD graph, plus a visible FAQ section (six questions, EN + ES)
with a matching `FAQPage` JSON-LD node.
