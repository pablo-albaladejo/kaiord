---
"@kaiord/zwo": patch
---

Keep workout steps in document order through ZWO. The reader and writer grouped Zwift intervals by element type, so a warmup, steady, intervals, steady, cooldown workout came back as steady, steady, warmup, cooldown, intervals. Both directions now follow the order of the file and of the KRD steps.

The writer also stops losing data inside repetition blocks:

- A block that is not one on/off pair of constant targets (three steps, a ramp, …) was silently dropped. It is now written out `repeatCount` times in place, with a `Lossy conversion:` warning.
- Power zones, watts, heart-rate targets, names, intensities and distance durations of the two `IntervalsT` steps were lost. They now round-trip through `kaiord:on*` / `kaiord:off*` attributes, and zones and watts also set `OnPower`/`OffPower` for Zwift.
- An open-target step written as `FreeRide` failed XSD validation because the schema refused the `kaiord:*` attributes on that element. The schema accepts them, and the reader restores the step's name, intensity and original duration.
