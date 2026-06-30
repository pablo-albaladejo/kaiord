---
---

Serialize zwo vitest files so the XSD validation Java subprocess runs one at a
time, eliminating flaky "does not conform to XSD schema" failures under load
(CI and the nightly full build). Test-infrastructure only; no runtime change.
