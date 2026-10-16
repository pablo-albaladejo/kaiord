> Tasks: 6 completed, 0 deferred

# Tasks

- [x] 1. Red first: `reduced-motion.spec.ts` (no preference) fails on main. The computed `html` `scroll-behavior` is `smooth` (Firefox), and `scrollY` is 0 right after `scrollTo({ top: 1500 })` (Chromium, WebKit). It passes once the declaration is gone.
- [x] 2. Red first: the `applyFocusToElement` unit test expecting `behavior: "instant"` with no motion option fails on the old helper and passes on the new one.
- [x] 3. Remove the global smooth scroll and the `useSectionScrollReset` override. Make the jump explicit in the focus, chat-result and import-dropzone scrolls.
- [x] 4. Remove the e2e workarounds that only existed for the glide (`click-centred`, forced `instant` in `openBlockActionsMenu`, the zones-sync comment). Keep `settings-section-scroll-jumps` and the `MenuItem` primitive.
- [x] 5. Full e2e suite on chromium, firefox, webkit, Mobile Chrome and Mobile Safari.
- [x] 6. Changeset: patch for `@kaiord/workout-spa-editor`.
