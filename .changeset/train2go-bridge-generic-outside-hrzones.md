---
"@kaiord/train2go-bridge": patch
---

Fix Generic HR block extraction in production T2G HTML. The `heart-rate-zone-generic` wrapper is rendered as a sibling under `<section class="pupil-details">` — outside the per-user `<div id="hrzones-{id}">` container that holds the sport-specific blocks. The parser used to slice `id="hrzones-{id}"` → first `</section>` and scan for all four zone wrappers in that slice, so on real T2G HTML it never reached generic and emitted only the cycling Specific block. The SPA mapper's Specific → Generic → skip fallback (D-FB1) consequently never fired for running and swimming, leaving those HR tables at 0-0 after sync.

Now the parser parses Generic from the full HTML (with comments stripped first so prose mentions of `heart-rate-zone-generic` in fixture headers can't anchor the wrapper regex). The lazy match in `extractHrFullBands` stays self-anchored on the literal class name and stops at the next `heart-rate-zone-X` or `</section>`, so the wider scope cannot bleed into sport-specific blocks. Sport-specific extraction continues to operate on the narrower slice for safety.
