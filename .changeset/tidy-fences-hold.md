---
"@kaiord/ai": patch
---

Stop untrusted text from breaking out of its fence. `fenceUntrusted` now
neutralizes the fence delimiters inside the payload before wrapping it, so
external text carrying the closing delimiter can no longer end the fence early
and land its remainder in trusted prompt space. The replacement carries no
`<`, so a delimiter cannot re-form from the neighbours of a neutralized one.
