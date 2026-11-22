## Context

The site is three builds (landing, App under `/app/`, VitePress docs under
`/docs/`) assembled by `scripts/assemble-site.mjs` and served by GitHub
Pages, which sets no response headers.

## Decisions

### D1. A `<meta>` policy written by the assembler

The only place every served page passes through is the assembler, and it
runs last on the bytes that ship, so the hashes it writes are the hashes of
what the browser will read. A `<meta>` policy governs only what is parsed
after it, so it goes first in `<head>`, after the charset.

### D2. Inline scripts by hash, never `'unsafe-inline'`

- **A.** `'unsafe-inline'` for scripts: any injected inline script runs.
- **B.** A nonce: needs a server to mint one per response; Pages cannot.
- **C.** The sha256 of each inline script, computed from the shipped page.

C is chosen. A VitePress or Vite upgrade that changes an inline script
changes its hash on the next assembly, with nothing to edit by hand.

### D3. The docs are covered, with the landing's sources

The docs were first left out as "their own build". They share the origin,
so leaving them out left one uncovered page enough to read the Provider key.
The shipped VitePress pages hold two inline scripts and module scripts from
`'self'`, use local search (no remote index) and load the same Umami tracker
as the landing, so the docs take the landing's source lists. Nothing in
VitePress needs `'unsafe-eval'`: the client bundle holds no `eval` or
`new Function`.

### D4. A guard that does not share code with the injector

`check-site-csp.mjs` parses the policy back out of the HTML with its own
reader (`scripts/lib/site-csp-read.mjs`), so a bug in the injector cannot
hide in the guard that judges it.
