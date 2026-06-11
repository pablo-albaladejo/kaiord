---
"@kaiord/tcx": patch
"@kaiord/zwo": patch
"@kaiord/garmin": patch
"@kaiord/garmin-connect": patch
"@kaiord/mcp": patch
"@kaiord/cli": patch
---

fix(tcx): cadence and pace targets now survive the TCX round-trip. The wired reader decodes native `Cadence_t`/`Speed_t` targets (previously degraded to `open`), running cadence converts between TCX steps-per-minute and KRD rpm (SPM = 2 × RPM) on both legs, and the writer matches the canonical `mps` pace unit. The orphaned parallel converter chain was removed.

Internal hardening with no public API changes: mcp derives `BINARY_FORMATS` from `FORMAT_REGISTRY` and rejects unsupported `output_format` values with an explicit error; zwo/garmin logic-bearing mapper files are now converters with co-located tests; garmin-connect auth internals use pronounceable names; cli internals renamed.
