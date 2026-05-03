---
"@kaiord/train2go-bridge": minor
---

Add `read-details` bridge action and `read:training-zones` capability. The action fetches the server-rendered `/user/details` page and parses the inline DOM into a stable `ZonesPayload` (raw shape: `physiological.{weight, bpmMax}`, `paces.{cycling.{z4Upper, z5Lower}, running.{z4Upper}, swimming.{z4Upper}}`, `hrZones.{cycling.{z4Upper}, running.{z4Upper}}`). Mapping to Kaiord-domain semantic names (`cycling.thresholds.ftp`, etc.) happens in the SPA — the bridge stays platform-shaped.

Defense-in-depth: `parseDetailsHtml` emits an explicit field allowlist; sensitive fields present on the page (gender, birthday, fat, smoker, IMC, bpm_rest, user_notes, coach.email, coach.name, email, records, tests) are dropped at parse time. A redaction unit test walks the parsed object recursively and asserts no forbidden key appears at any nesting depth.

Content script `handleFetch` now dispatches by `Content-Type`: `text/html` responses are read via `r.text()`, JSON responses via `r.json()`. ALLOWED list expands by one entry (`/user/details`) and the privacy-surface golden fixture is updated to its full canonical 5-entry shape (Boy-Scout-Rule fix of pre-existing 2-entry drift). New script-level test asserts `bridge-privacy-surface.json.allowed_paths.length === content.js ALLOWED.length` mechanically.
