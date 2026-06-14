---
"@kaiord/ai": minor
"@kaiord/workout-spa-editor": minor
---

Add an in-SPA AI chat assistant.

`@kaiord/ai` gains `createChatAgent`: a provider-agnostic, multi-step
tool-calling chat engine on the Vercel AI SDK (read tools auto-execute;
action tools pause for explicit user confirmation and resume).

The workout SPA editor gains a `/chat` page that answers questions over the
user's own history (workouts, coaching, the six health metrics) and performs
confirmation-gated actions (sync coaching, create a workout, log a health
metric), reusing the existing AI provider credentials. Transcripts persist
per profile (Dexie v20 `chatMessages`) and ride the existing cross-device
cloud-sync snapshot; per-turn token usage is recorded in the monthly usage
row. No new backend and no new runtime dependencies.
