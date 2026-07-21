---
"@kaiord/fit": patch
---

Stop double-scaling bone/muscle/weight in the FIT body-composition and
weight-scale converters. The `@garmin/fitsdk` Encoder/Decoder auto-applies the
FIT profile scale (100) for the `weight`, `muscleMass`, and `boneMass` fields,
so the mappers now carry real kilograms end-to-end. The previous manual ×100
was a double scale that overflowed the uint16 raw and corrupted the value on a
real byte encode (e.g. 58.2 kg decoded back as 577.12) — verified and locked
with a live `@garmin/fitsdk` encode→decode probe.
