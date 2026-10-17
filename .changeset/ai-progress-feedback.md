---
"@kaiord/ai": minor
"@kaiord/workout-spa-editor": patch
---

AI workout conversion reports real progress instead of a static spinner. `createTextToWorkout` (and `runGenerateAgent`) accept an `onProgress` listener: when one is given, the structured output streams and the run reports its phase (`requesting` → `generating` → `validating`), the attempt number of any schema-repair retry, and — for the workout parser — how many steps the partial output already holds. A model that cannot stream falls back to one-shot generation and still reports its phases. `createTextToWorkout` also accepts a `signal`, so cancelling aborts the provider request itself.

In the calendar's coached-session dialog, "Convert with AI" now shows which model is working, the current phase (announced politely to screen readers once per phase), the steps written so far and the elapsed seconds, and Cancel aborts the request in flight rather than only hiding the wait.
