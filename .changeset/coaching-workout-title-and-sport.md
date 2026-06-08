---
"@kaiord/workout-spa-editor": patch
---

Coaching-derived workouts now keep their title and sport

When a coaching activity was materialised into a structured workout (manual
"create from coaching" path), the generated KRD carried neither the activity's
title nor its sport: the editor showed "Untitled Workout" and "Sport: generic".
The template builder now seeds the KRD workout name from the coaching activity
title and canonicalizes the source sport onto the KRD vocabulary (e.g.
`bike` → `cycling`, `swim` → `swimming`). Sports the KRD model does not
represent (e.g. gym/strength) still collapse to `generic` honestly.
