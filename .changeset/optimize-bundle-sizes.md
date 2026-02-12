---
"@kaiord/core": patch
---

perf(core): reduce published dist from 1.8M to 268K

- Split tsup config to disable sourcemaps for test-utils entry
- Externalize devDependencies (@faker-js/faker, rosie) from test-utils build
