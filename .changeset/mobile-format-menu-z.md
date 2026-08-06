---
"@kaiord/workout-spa-editor": patch
---

Raise the export format dropdown above the floating bottom nav. The menu sat at `z-10` under the nav's `z-30`, so on mobile the last format options rendered beneath the nav and taps landed on the nav's buttons instead — the repo's chrome/popover convention is `z-50` for open menus and dialogs.
