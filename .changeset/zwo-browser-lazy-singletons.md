---
"@kaiord/zwo": patch
---

Importing the browser entry no longer logs "Browser environment detected". The `zwiftReader` and `zwiftWriter` singletons are now built on first use, so a caller that passes its own logger to `createZwiftReader` or `createZwiftWriter` sees no output from the default console logger.
