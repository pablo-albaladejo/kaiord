---
"@kaiord/docs": patch
---

Emit `rel=canonical` on every docs page and align TechArticle URLs with the
clean URLs actually served. Each docs page is reachable under three variants
(clean, `.html`, and the `.md` LLM mirror); without a canonical, search
engines pick arbitrarily across ~330 pages.
