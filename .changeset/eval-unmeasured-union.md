---
"@kaiord/ai": patch
---

Distinguish "measured and failed" from "never measured" in the eval suite.
`unmeasured` is now a member of the dimension-outcome union carrying a reason
and no score, so a criterion nobody measured cannot enter a rate. Reports tally
each dimension as `{measured, passed, unmeasured, reasons}`, and a dimension
with no measurements has no rate at all rather than 0% or 100%.
