# @kaiord/landing

## 4.2.0

### Minor Changes

- f334931: Reposition the landing around the training platform: new calendar cockpit, conversational assistant, health hub, and data hub sections; updated hero, nav, phone mock (week strip, WHOOP badge, chat input), SEO metadata and JSON-LD, zero-infrastructure copy, and open-source metrics.

### Patch Changes

- 36efe53: Optimize the site for AI agents and answer engines (GEO). Add a curated root
  `llms.txt` pointing at the product pages and the docs markdown corpus, stop
  blocking `/editor/` in `robots.txt`, and replace the root sitemap with a
  sitemap index covering the landing (with hreflang alternates), the editor,
  and the VitePress docs sitemap (which now stays at `/docs/sitemap.xml`).
  Enrich the editor shell for non-JS crawlers: descriptive title and meta
  description, `WebApplication` JSON-LD with a feature list, and `noscript`
  content linking back to the landing and docs. Add a `WebSite` node to the
  landing JSON-LD graph, plus a visible FAQ section (six questions, EN + ES)
  with a matching `FAQPage` JSON-LD node.
- 2ddc8cb: Regenerate og-image.png to match the platform repositioning: tagline updated from "One framework. Every fitness format." to "Your training cockpit. Every fitness format."
- Updated dependencies [6025135]
- Updated dependencies [e167efe]
- Updated dependencies [32c4c1c]
- Updated dependencies [95da9fa]
- Updated dependencies [372db2c]
- Updated dependencies [dfa21e6]
- Updated dependencies [9f08136]
- Updated dependencies [d777295]
- Updated dependencies [0841993]
- Updated dependencies [63c4cb6]
- Updated dependencies [a2a5b12]
- Updated dependencies [78c1866]
  - @kaiord/core@10.0.0

## 4.1.2

### Patch Changes

- Updated dependencies [73a2ce4]
- Updated dependencies [bad73d3]
- Updated dependencies [cfb1b06]
  - @kaiord/core@9.2.0

## 4.1.1

### Patch Changes

- Updated dependencies [45a788a]
- Updated dependencies [2678d66]
  - @kaiord/core@9.1.0

## 4.1.0

### Minor Changes

- d77a600: Redesign the kaiord.com landing around an explicit audience fork, resolving the consumer-vs-developer identity crisis.
  - **Hero** is now a neutral headline plus two equal path cards — _For athletes → Use the editor_ (editor mockup, "Open the Editor") and _For developers → Build with the SDK_ (`convert.ts` snippet + `npm i @kaiord/core`, "Read the Docs"). They sit side-by-side ≥860px and stack on mobile.
  - **Showcase** band ("Plan, generate, sync.") pairs a lightweight CSS editor mockup with the three athlete features.
  - **Format hub** redrawn as a radial diagram — KRD hub centered, `.FIT/.TCX/.ZWO/.GCN` around it with bidirectional connectors — replacing the mirrored two-column layout.
  - **"100% AI-coded"** demoted from a hero badge + full card to a single honest line beside open-source.
  - **Open-source metrics** changed to ones that sell: 5 adapters / 100% round-trip / MIT / 0 backend services.
  - Same framework-free stack (hand-authored `index.html` + Tailwind v4 + shared `brand-tokens.css`). The install-command island moves to `src/install-widget.ts` (extracted from `main.ts`, now unit-tested) and gains a copy→checkmark affordance. All prior accessibility is preserved: skip link, ARIA diagram, 44px touch targets, focus rings, reduced-motion.

### Patch Changes

- Updated dependencies [a015501]
- Updated dependencies [82a7467]
- Updated dependencies [275c221]
- Updated dependencies [d597cb4]
  - @kaiord/core@9.0.0

## 4.0.3

### Patch Changes

- Updated dependencies [581239f]
  - @kaiord/core@8.0.0

## 4.0.2

### Patch Changes

- Updated dependencies [79be4f3]
- Updated dependencies [d66e509]
  - @kaiord/core@7.2.0

## 4.0.1

### Patch Changes

- Updated dependencies [1eb5fd0]
  - @kaiord/core@7.1.2
