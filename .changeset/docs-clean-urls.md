---
"@kaiord/docs": patch
---

Enable VitePress `cleanUrls` so canonical docs URLs are extensionless
(better for search-engine and AI-agent citations; the `.html` files are
still emitted, so existing links keep working), and fix the docs sitemap
to include the `/docs/` base — VitePress does not prepend `base` to
sitemap entries, so every URL pointed at the site root
(`kaiord.com/CHANGELOG` instead of `kaiord.com/docs/CHANGELOG`).
