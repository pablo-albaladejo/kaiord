---
"@kaiord/fit": patch
---

Add an internal `maxOutputBytes` option to the FIT writer that bounds the
encoder's output buffer. The Garmin SDK always reserves a resizable buffer
with a 500 MB ceiling, which a Cloudflare Worker isolate refuses; the option
needs the monorepo's patched `@garmin/fitsdk` and throws without it. Writers
created without the option behave exactly as before.
