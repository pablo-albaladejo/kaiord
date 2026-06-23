---
"@kaiord/tcx": patch
---

fix(tcx): validate restored `kaiord:` duration thresholds are positive and finite. A present-but-invalid heart-rate / power / calorie attribute (0, negative, NaN, or Infinity) now warns and degrades instead of silently restoring a physiologically meaningless duration.
