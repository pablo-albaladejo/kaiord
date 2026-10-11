---
"@kaiord/workout-spa-editor": patch
---

Importing a TCX workout keeps its repeat blocks, and an import that could not be converted exactly (a step the reader had to skip, a target it could not map, a nested repeat it unrolled) now shows an "Imported with warnings" toast in the editor and the converter, instead of only logging to the browser console.
