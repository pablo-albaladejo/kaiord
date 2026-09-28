---
"@kaiord/workout-spa-editor": patch
---

Stop sending per-person identifiers to Umami: no analytics event carries `profileId` any more (the Umami adapter also strips it as a safety net), and page views of a workout or chat submit the route pattern (`/workout/:id`, `/chat/:conversationId`) instead of the record id.
