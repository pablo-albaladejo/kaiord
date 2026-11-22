## Context

Two layers decide who may message an extension. Chrome reads
`externally_connectable.matches` and refuses delivery from any other page.
Then the shared envelope guard checks `sender.origin` before any action
handler runs. Both accepted every `kaiord.com` subdomain. The announce
content script, injected wherever its manifest entry matches, gave the
extension id to every subdomain too.

## Decisions

### D1. Exact string comparison, not a pattern

The guard compares `sender.origin === "https://kaiord.com"`. A regex over the
domain is how the subdomain group crept in, and a string cannot grow one. The
root guard refuses a `kaiord\.com` regex or a `*.kaiord.com` literal in any
shipped bridge file.

### D2. No answer to a refused origin

The ticket asks for "no answer". The guard returns `false` without calling
`sendResponse`. Chrome then closes the port, and the caller sees only that no
response arrived. Refused origins used to get
`{ ok: false, error: "Origin or action not permitted" }`, which confirmed the
extension was installed. An allowed origin asking for an action outside the
allowlist still gets that error envelope; refusing paths outside the closed list is
another ticket.

### D3. Dev origins only in a development build (the stricter option)

The bridges ship as flat files that `package-extension.sh` copies verbatim,
so the same `bridge-envelope.js` runs in the dev and the store build. Two
options:

- **A.** Keep accepting localhost in the shared code, and rely on
  `manifest.prod.json` leaving it out of `externally_connectable`. The
  packaged code would still say yes to localhost if Chrome ever delivered such
  a message.
- **B.** Accept a dev origin only when the loaded manifest
  (`chrome.runtime.getManifest()`) declares it in
  `externally_connectable.matches`. The packaged build refuses localhost in
  Chrome and in code.

B is stricter and adds no build step, so B is chosen. The dev content-script
match `http://localhost/*` stays as it is: it is dev-only, the guard keeps it
out of `manifest.prod.json`, and narrowing it to ports is not part of this
ticket.

### D4. The guard lives in the root `check-*` family

It joins `check-bridge-privacy-surface` (which pins the manifests' bytes) as a
rule about meaning: the golden says what the surface is, this guard says what
it may never be. Finding no bridge, or a bridge without a `manifest.json`, is
a fault.

## Risks

- A future Kaiord host other than the apex (a preview deployment) needs an
  explicit entry in both the manifests and the guard's closed set. That is
  deliberate.
