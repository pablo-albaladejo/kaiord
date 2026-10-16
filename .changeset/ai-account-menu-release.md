---
"@kaiord/workout-spa-editor": patch
---

Dropdown menus no longer choose an item by themselves when the press that opened them is released over it, which happened when the page was still scrolling under the pointer. Every menu now uses one shared `MenuItem` primitive, and lint keeps new menus on it. Choosing a row by holding the button on the trigger and releasing on the row (desktop press-drag-release) is given up on purpose: it is the same gesture as the accidental one.
