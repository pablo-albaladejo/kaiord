---
"@kaiord/workout-spa-editor": patch
---

Typing right after opening a page no longer loses keystrokes on iPhone. After a page change the editor moves focus to the page heading and retries while Safari ignores that focus; a retry that landed after you had already tapped a field took focus back, so the text you typed next went nowhere (an API key field could stay empty). The retry now stops as soon as focus has moved somewhere else.
