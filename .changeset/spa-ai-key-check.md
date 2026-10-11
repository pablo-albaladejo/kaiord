---
"@kaiord/workout-spa-editor": patch
---

Settings → AI checks a provider's key before saving it: a key the provider rejects is not saved, and one that cannot be checked is saved with a note. The chat explains a missing profile or a provider restored without its key, never offers a keyless provider, and its model picker no longer shows empty parentheses. A failed chat turn no longer throws an uncaught `No output generated` page error.
