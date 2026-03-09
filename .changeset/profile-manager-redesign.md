---
"@kaiord/workout-spa-editor": minor
---

Redesign Profile Manager with zone method system

- Add zone method registry (Coggan, Friel, British Cycling, Karvonen, Daniels, Custom)
- Replace auto/manual toggle with method dropdown per zone type
- Show zone values in real units (watts, bpm, min/km) instead of percentages
- Redesign Profile Manager layout: remove Edit Profile card, add Training Zones and Personal Data tabs
- Add inline-editable profile name in dialog header
- Support custom zone count (add/remove zones, 1-10 range)
- Update LLM zones formatter to output real values with method names
- Add migration from legacy `mode` field to `method` field
