---
"@kaiord/garmin": patch
---

A single-value pace target (`{ "unit": "mps", "value": … }`) is now exported to Garmin Connect as a ±5 s/km band around that pace, fastest bound first, instead of a zero-width range. Before, a 4:45 min/km step reached the watch as "4:45-4:45 min/km", so the pace alert fired whenever the runner was off that exact pace; it now shows 4:40-4:50 min/km. Non-positive speeds (no finite pace) are passed through unchanged.
