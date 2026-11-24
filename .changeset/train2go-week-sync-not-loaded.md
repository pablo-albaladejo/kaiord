---
"@kaiord/workout-spa-editor": patch
---

When part of the Kaiord App does not load, Train2Go's week sync and connect no longer fail silently or as Train2Go not answering: the athlete sees that part of the Kaiord App did not load, so nothing was asked of Train2Go, with a Reload button. The Assistant's sync tool tells the model the same, so it neither retries nor blames Train2Go. The sentence now lives under one key in the `coaching` dictionary, and the toast with Reload is built by the component layer, not by the Train2Go adapter.
