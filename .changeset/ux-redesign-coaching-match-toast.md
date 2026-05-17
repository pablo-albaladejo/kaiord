---
"@kaiord/workout-spa-editor": patch
---

UX redesign Phase 1 leftover: surface a success toast when a coaching
activity is matched to a workout (manual picker) or converted to a
new manual workout via the coaching dialog. Both success branches now
fire `toast.success("Workout matched", activity.title, { duration: 3000 })`.
The manual handler fires the toast BEFORE `onClose()` to make the
ordering explicit, even though `AppToastProvider` lives above the
dialog tree and would survive unmount either way. Static title
satisfies the R-PIIInterpolation guard; the dynamic activity title
flows through the description field. Removes another of the
"asymmetric handoff" dead-ends identified by the deep-dive trace.
