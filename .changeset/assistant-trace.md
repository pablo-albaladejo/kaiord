---
"@kaiord/workout-spa-editor": minor
"@kaiord/docs": patch
---

Every run of the assistant leaves a Trace on the athlete's device: a chat turn, a workout generation, a batch or a lab document read. It records when it ran, the feature, the Provider and model, the prompt version, each Tool with whether the athlete confirmed it and how it ended, retries, how long it took, the outcome, its cost per model and which kinds of data went to which Provider; never a message, prompt, document or answer. Traces never leave the device: they are not in the Drive sync snapshot nor in a backup file, and nothing that is names a Trace. The newest 200 are kept, none older than 90 days. Settings, Privacy lists them, opens each one, exports them all as JSON and deletes them; the data-flow inventory lists them as kept on this device. The generation debug line in the console is gone. In English and Spanish. The privacy policy says the same.
