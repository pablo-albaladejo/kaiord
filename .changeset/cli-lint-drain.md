---
"@kaiord/cli": patch
---

Internal hardening: the CLI package now runs ESLint in CI (a missing
`lint` script meant it never had), with all pre-existing violations
fixed — including `cause` chaining on re-thrown filesystem errors and
complexity-reducing helper extractions in the convert/diff/validate
commands. No behavior or API changes.
