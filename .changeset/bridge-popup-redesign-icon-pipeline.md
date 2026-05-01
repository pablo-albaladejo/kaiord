---
"@kaiord/garmin-bridge": patch
"@kaiord/train2go-bridge": patch
---

Regenerate extension icons from a single shared SVG master at `packages/_shared/extension-icon/master.svg`. Both bridges now use a Kaiord hex silhouette with a per-bridge accent: Garmin → blue (`#007cc3`), Train2Go → coral (`#f74464`) — visually distinguishable in the browser toolbar at every size. Adds `pnpm icons:build` and `pnpm lint:icons-distinct` to the repo, with a mechanical guard that fails the lint job if the icons drift below the inter-bridge mean-color-delta or accent-mass thresholds.
