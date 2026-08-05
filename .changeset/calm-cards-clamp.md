---
"@kaiord/workout-spa-editor": patch
---

Move the calendar card title clamp from the flex title row onto the title span. `line-clamp-2` and `flex` both set `display`, so only one survives the cascade — with both on the row, the clamp was silently inert and long titles grew past two lines in narrow day columns. Titles now clamp to two lines beside the state pill and break long words anywhere instead of overflowing.
