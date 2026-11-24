## Context

A review of the Bridges block found secrets, unbounded writes and unverified
sign-outs in code that runs with the athlete's Platform Sessions, plus texts
and structure that had drifted from the code. Each fix keeps the wire shapes
the store versions and the App already read.

## Decisions

### D1. Strip by name, in one master

The extensions never parse answers for the App (ADR 0004), so the strip is
syntactic: fields and members named as a token, CSRF, XSRF, session, nonce,
key, password or cookie, in HTML and JSON. Account ids the Connector reads
stay. The audit found Train2Go's `_token` (profile and day pages) and nothing
on Garmin, TrainingPeaks, WHOOP or Tanita's CSV; the strip still runs on all
five, so a Platform that adds one is covered. Rejected: per-extension lists
(five copies to keep equal) and parsing pages in the extension.

### D2. Garmin's bodies are the encoder's own output

The accepted FIT file type is 9 (weight), from
`krd-to-weight-scale-fit.converter.ts` (`buildHealthFileIdMessage(krd,
"weight")`, one `weight_scale`); the workout schema is what `@kaiord/garmin`
writes. Neither was checked against Garmin, only against Kaiord's encoders.

### D3. Signed out only on the Platform's word

A redirect to the sign-in page, a 401, Garmin's sign-in page issuing no
ticket and Train2Go's `Unauthenticated` ping are verified; everything else is
not answering. MyTANITA's HTML sign-in markup is not in the fixtures, so any
HTML in place of the export is not answering; the redirect is the signal.

### D4. The protocol decides what may be asked

Discovery's verification answer carries the protocol; a protocol-1 Garmin,
TrainingPeaks or Tanita is not checked. Discovery's own verification ping is
unchanged and still costs a store Garmin or protocol-1 Tanita extension one
read per announcement; replacing it is left to the owner.

### D5. WHOOP answers two booleans in its check

To show "Open WHOOP" and the no-account-id notice at the same moment as the
popup without a second message or the id, the check answers `hasAccountId`
and `tabOpen` as yes or no. The privacy policy and justification disclose
them; no request is made and no tab address leaves.

### D6. A generated copy, not a package

`pnpm bridge:sync` writes the notices master into
`packages/i18n/src/generated/`, held byte-identical by the parity guard.
Promoting bridge-core to a package would add publish wiring for one file.

### D7. Deploy order: the App first, then the extensions

An App tab opened before the update rejects any envelope whose protocol is
not 1 as an outdated extension, so it shows Update, never "signed out"; the
new `ping` with no token answers `not-checked`, `gcApi.ok: false` and no
`needsReauth`. The App ships first (it reads both protocols); the extensions
follow through the store.

### D8. Archive order

This change MODIFIES the Session check requirement `cheap-session-check`
adds and adds to the `connection-notices` capability that
`connection-notices-four-fixes` creates: it is archived after both, and after
`thin-bridge-four`. The earlier in-place rewrites were moved back: the
`thin-bridge-train2go` train2go-bridge delta and the Tanita and TrainingPeaks
policy requirements are their owners' again, and `cheap-session-check` and
`extension-names-en-es` modify them in their own deltas.
