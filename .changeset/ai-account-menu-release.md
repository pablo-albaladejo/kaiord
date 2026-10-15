---
"@kaiord/workout-spa-editor": patch
---

Dropdown menus no longer choose an item by themselves when the press that opened them is released over it, which happened when the page was still scrolling under the pointer. Every menu now uses one shared `MenuItem` primitive, and lint keeps new menus on it.
