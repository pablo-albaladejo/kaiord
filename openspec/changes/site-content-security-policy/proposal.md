## Why

Review of 2026-11-22, issue #1639 (parent #1670, "Safe by construction").

- kaiord.com served no content security policy. The athlete's Provider key is
  readable by any script that runs on the origin, and the five extensions
  trust that origin, so one injected script on any page of it, App, landing
  or docs, reaches both.
- GitHub Pages sets no response headers, so a policy can only be a
  `<meta http-equiv="Content-Security-Policy">` in each page.

## What Changes

- `scripts/lib/site-csp-policy.mjs` holds one policy per surface (landing,
  docs, App), one source list per directive, each remote origin traced to the
  code that calls it. Scripts run only from `'self'`, the sha256 of each
  inline script, the Umami tracker and, on the App, the Google sign-in
  client. No `'unsafe-inline'`, `'unsafe-eval'`, scheme or wildcard for
  scripts; `object-src` and `base-uri` `'none'`.
- `scripts/assemble-site.mjs`, as its last step, writes the policy first in
  `<head>` (after the charset, ahead of every script) on every HTML page of
  the assembled site, the docs included, hashing the inline scripts in the
  bytes that ship. The docs' VitePress build carries two inline scripts
  (theme and platform class), hashed like any other.
- The App and the landing set zod's `jitless` before the bundle, so zod's
  `Function("")` probe never meets the policy.
- The SPA dev server serves the App policy, and the e2e base fixture fails a
  test on any `securitypolicyviolation`.
- `scripts/check-site-csp.mjs` reads the policy back out of every assembled
  page and fails on a missing policy, an unsafe script source or an unhashed
  inline script. It shares no code with the injector and runs in
  `e2e-prod-base` and before deploy.
- `content-security-policy.spec.ts` (`@csp`, in `e2e-prod-base`) loads the
  built App, the real landing and the real docs: no unsafe script source, an
  injected script blocked, every page loaded with no violation, the docs'
  local search and theme switch working. CI hands the docs build to
  `e2e-prod-base` as the `docs-dist` artifact.

## Impact

- Packages: `@kaiord/workout-spa-editor`, `@kaiord/landing`, `@kaiord/docs`
  (served bytes only); `scripts/`; `ci.yml` (`docs-dist` artifact).
- Styles keep `'unsafe-inline'`: the landing and the docs carry style
  attributes and the App's UI libraries insert `<style>` at run time. A style
  cannot run code.
- Out of scope: `frame-ancestors`, `report-uri` and `sandbox`, which a
  `<meta>` policy ignores; a header-based policy, which needs a host that
  sets headers.
