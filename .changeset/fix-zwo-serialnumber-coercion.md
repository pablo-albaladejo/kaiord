---
"@kaiord/zwo": patch
---

Fix `zwo → *` conversions failing on a numeric serial number (#976). The ZWO
reader emitted `serialNumber` as a number when the source attribute was numeric
(e.g. `serialNumber="1234"`), which the KRD domain schema rejects because it
types `serialNumber` as a string. The reader now coerces the value to a string
at the KRD boundary, keeping the domain schema strict.
