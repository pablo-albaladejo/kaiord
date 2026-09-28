---
"@kaiord/docs": patch
"@kaiord/landing": patch
---

Docs: API symbol pages are `noindex,follow` and leave the sitemap (374 → 37 URLs), the root README and CHANGELOG are no longer built as pages, and pages show a git "Last updated" date with `dateModified`. Landing: `sitemap-landing.xml` is generated at build with git `<lastmod>`, and the EN/ES descriptions fit in 160 characters.
