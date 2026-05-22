---
"@kaiord/workout-spa-editor": minor
---

feat(spa-editor): library page short-circuits scheduling when entered with `?source=template-picker&date=YYYY-MM-DD`. Clicking a template card now dispatches `scheduleTemplate` directly with the URL's date and navigates to `/calendar`, instead of opening `ScheduleDateDialog`. Invalid or absent `?date=`, or a different `?source=`, keeps the existing explicit-dialog flow. Implementation reuses `usePickerSchedule` (PR #650) via a new `useLibrarySchedule` hook so the library schedule call site stays a single line.
