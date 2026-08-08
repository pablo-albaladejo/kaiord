---
"@kaiord/workout-spa-editor": patch
---

Express every destructive affordance through the `danger` role instead of raw Tailwind reds. 137 usages across 32 files named `red-*`/`rose-*` directly — outside the three-layer system entirely, since a component may only ever name a role — and each carried a hand-paired `dark:` variant. The roles already hold a value per theme, so those pairs collapse: `text-red-600 dark:text-red-400` becomes `text-danger-text`, and the diff removes more lines than it adds.
