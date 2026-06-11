---
"@kaiord/train2go-bridge": patch
---

Harden HTML sanitization in the Train2Go parser: entity decoding is now
single-pass (no double-unescaping of payloads like `&amp;lt;`) and tag,
comment, and script/style stripping repeat until stable so interleaved
markup cannot re-form a tag after one pass. Resolves the CodeQL
`js/double-escaping` and `js/incomplete-multi-character-sanitization`
findings.
