---
"@kaiord/train2go-bridge": patch
---

Fix coaching activity description leaking the opening tag of the next sibling block (`<div class="`) into the rendered text.

`extractDescription` used a lookahead on the literal substring `activity-hint-ecos`, so the captured chunk reached the position just before that text — which is INSIDE the opening `<div class="..."` of the hint-ecos sibling. The strip-divs-with-content regex below only matches complete `<div>...</div>` blocks, so the partial opening tag survived and ended up in the description. Anchored the lookahead on the full `<div[^>]*activity-hint-ecos` opener instead.
