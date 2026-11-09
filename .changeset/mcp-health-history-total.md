---
"@kaiord/mcp": patch
---

`kaiord_get_sleep_history`, `kaiord_get_weight_history` and `kaiord_get_hrv_history` no longer count a matching KRD that lacks the requested health entry in `total`, so `total` always matches the records the tool can return.
