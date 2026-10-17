---
"@kaiord/ai": minor
"@kaiord/workout-spa-editor": patch
---

AI workout generation now gives every running step a pace target and every cycling step a power target, taken from the athlete's own zones. The workout parser prompt (1.1.0) gains sport target rules and a Spanish/English intensity vocabulary ("suave"/"trote"/RPE 2-3 → Z1, short "fuerte"/"cambio fuerte" → Z4-Z5, "a tope" → Z5, "progresivo" → a zone span, "R: 2'" → a Z1 recovery step, "30' con (…)" → whole repeated cycles). The model emits zone numbers; `createTextToWorkout` resolves them in code against `TextToWorkoutOptions.athlete.zones` into explicit m/s or watt ranges (pace only on running, power only on cycling), turns a zone the athlete has not configured into `open` rather than guess or block the Garmin push, and gives open warmup/recovery/cooldown steps the zone 1 range when the athlete has one. The athlete blocks are length-capped and cannot close or open each other. `athlete.zonesText` and `athlete.instructions` are appended to the user message in their own delimiters.

In the editor, every generation path — Train2Go batch conversion, converting a coached session from its card, create-from-text, the AI input and the chat — now sends the athlete's zones and their "Instructions for the AI"; the Train2Go paths previously sent neither, so coached sessions came back with "Open" and bare "Zone 1" targets.
