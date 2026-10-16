---
"@kaiord/workout-spa-editor": patch
---

A profile deleted while a sync is between reading the local data and importing the merge now loses all of its data on this device and in the snapshot that sync pushes. Before, its entries came back as orphans and were pushed until the next sync dropped them.
