---
"@kaiord/workout-spa-editor": patch
---

The assistant can be stopped mid-reply. While a reply streams, the composer's Send button becomes a Stop control ("Detener" in Spanish); stopping keeps the partial reply in the transcript, marked as stopped, and leaves no action waiting for confirmation. A reply that stalls past the turn time limit is kept and marked the same way. Chat usage is now recorded through the same usage telemetry sink as workout generation and lab extraction, so turns that paused for a confirmation or were stopped are counted too, each tagged with its trace id and model.
