---
"@kaiord/workout-spa-editor": patch
---

The assistant can be stopped mid-reply. While a reply streams, the composer's Send button becomes a Stop control ("Detener" in Spanish). Stopping keeps the partial reply in the transcript with a localized "stopped" note and leaves no action waiting for confirmation. A reply that goes silent past the inactivity limit is kept and noted the same way. The reason is stored on the message (`stopReason`), not written into its text. Only the history replayed to the model carries a short marker. The input regains focus when the reply settles.

Chat usage is now recorded through the same usage telemetry sink as workout generation and lab extraction. Turns that paused for a confirmation, were stopped, or failed after some steps are counted too, each tagged with its trace id and model.
