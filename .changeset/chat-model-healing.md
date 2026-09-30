---
"@kaiord/workout-spa-editor": patch
---

A chat conversation started under a since-retired model no longer fails every turn with a 404: the stored model heals to its successor, and the chat shows "X was retired by the provider — using Y instead". Switching a conversation's provider no longer stores a retired model as its override. Settings → AI names the successor of a retired model and warns about deprecated ones. The lab-import "model unavailable" message is now translated.
