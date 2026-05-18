---
"@kaiord/workout-spa-editor": minor
---

Inline the UX 2026 redesign and remove the feature flag system. Settings now live at `/settings/<tab>` (profile, ai, extensions, usage, privacy) with a sidebar tablist; the persistent `StatusHeader` is always rendered and exposes Profile / Help / Settings entry buttons. The `SettingsPanel` and `ProfileManager` dialog wrappers, the `useSettingsDialog` context, the legacy `HeaderNav` / `DesktopNav` / `MobileMenu`, the `feature-flags` module, and the `R-SettingsSingleEntry` lint guard are all removed. Empty-state shortcuts and the editor "configure AI" affordance now navigate to `/settings/<tab>` instead of opening dialogs.
