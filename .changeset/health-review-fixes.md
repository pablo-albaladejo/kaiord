---
"@kaiord/ai": minor
"@kaiord/workout-spa-editor": patch
"@kaiord/docs": patch
---

What the athlete is told about their health data holds on every path.

- `@kaiord/ai`: a chat turn's result names the tools it ran (`toolNames`), a stopped turn included, and `@kaiord/ai/providers` exports `LLM_PROVIDER_TYPES`.
- Kaiord App: a workout the assistant creates after reading health data goes to the Provider that generates workouts only once the athlete allows that Provider; on "don't send" it is not created, and the athlete is told why. After "don't send", no reply that may quote health data is replayed, a stopped one or one stored by an older build included. Stop while the health question waits sends nothing; two requests for one Provider share one answer. A Trace lists the kinds of data each request carried, and apart the ones it may have carried but cannot count; a run waiting on the question already leaves a Trace. In English and Spanish. The privacy policy says the same.
