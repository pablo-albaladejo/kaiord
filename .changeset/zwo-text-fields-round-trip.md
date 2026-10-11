---
"@kaiord/zwo": patch
---

Keep ZWO text intact on import and export. Step, workout and side names that look like numbers (such as "1" or "30") now stay strings, text events on the off-step of an `IntervalsT` are kept, and text event messages survive a second ZWO pass. The ZWO fixtures carry the offset-corrected heart-rate condition (125 bpm).
