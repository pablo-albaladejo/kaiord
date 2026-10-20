---
"@kaiord/ai": patch
"@kaiord/workout-spa-editor": patch
---

AI-generated workouts get a real name instead of "Untitled Workout". The
workout parser's structured-output schema now carries `name` (it previously
omitted it, so any name the model produced was stripped) and the prompt asks for
a concise title in the language of the input; a blank name is dropped. In the
editor, a coaching or batch-processed workout falls back to the coached session's
own title when the AI gives none, and only then to the localized default.
