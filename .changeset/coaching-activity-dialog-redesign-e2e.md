---
"@kaiord/workout-spa-editor": patch
---

Coaching activity dialog redesign — e2e regression specs (PR 4/4):

- Adds `e2e/coaching-dialog-redesign.spec.ts` with three Playwright specs:
  - **Flow (d)** — `[Edit manually]` creates a structured workout + session_match and navigates to the editor with the sidebar visible.
  - **Flow (e)** — a seeded converted-without-match workout (legacy state) is silently auto-healed when the dialog opens; the dialog re-renders into the matched state with `LinkedWorkoutSection`.
  - **Flow (h)** — an empty-description activity surfaces the AI hint in the dialog footer.

The AI-bound flows (a/b/c/f/g) require Playwright route mocking for the LLM transport and are tracked as follow-up issues filed at archive time.
