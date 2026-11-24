## Why

Code review of the Bridges block (#1670; tickets #1641–#1644, #1646; issues
#1091, #1098, #1100). The extensions and the App did not yet do what the
block's changes and public texts said:

- Train2Go handed the App its anti-forgery `_token` with the profile and day
  pages, a Session-bound secret ADR 0002 keeps off Kaiord.
- Garmin's `fit-file` accepted any FIT file, an activity included, and its
  `workout` any JSON up to 64 KB; WHOOP's content script accepted any GET on
  the WHOOP API host.
- A 403, a MyTANITA maintenance page or a Train2Go failure was reported as
  signed out, which the Platform never verified.
- The store Garmin and TrainingPeaks extensions were still asked a check
  that reads a workout or mints a token on every refresh.
- A WHOOP sign-in with no account id was "Connected" with imports silently
  empty (#1091); WHOOP was said to mint a token; the popup's "Open WHOOP"
  had no counterpart in the App; Install and Update opened a page that does
  not exist.
- Store listings, justifications and the policy described popup states and
  reads the code no longer has; the App held a class, two outcome
  vocabularies, text matching for outdated extensions and five Connectors
  spread over `hooks/` and `store/`; OpenSpec requirements had been rewritten
  in place by later changes.

## What Changes

- **No Session secret leaves an extension.** A shared master,
  `bridge-answer.js`, strips token, CSRF, session and nonce fields from every
  HTML and JSON answer of all five extensions.
- **Closed bodies and paths.** Garmin uploads only a FIT weight file (type 9,
  at most 4 KB, one `weight_scale`) and the closed workout shape the writer
  emits; WHOOP's content script keeps the service worker's closed list.
- **Signed out only when verified**, in the extensions and the App; a 403 is
  not answering.
- **No costly check on the store versions**: Garmin, TrainingPeaks and Tanita
  on protocol 1 are reported not checked without a message.
- **Honest notices**: not-checked worded per reason, WHOOP's no-account-id
  and no-tab notices shown by the popup and the App from the same check,
  fix targets that resolve to the new install guide
  (`/docs/guide/install-extensions`, en and es) or Garmin's listing.
- **Repo standards**: the notices reach `@kaiord/i18n` as a generated copy;
  one tagged error instead of a class; one `SessionOutcome`; the protocol
  version alone tells an outdated extension; one Connector call helper and
  each Connector under `adapters/<platform>/connector/`; one shared request
  gate, answer and broken notice for the extensions; Garmin's service worker
  split into imported modules; one typed descriptor per extension.
- **Texts and specs**: listings, justifications, policy and claims follow the
  code; OpenSpec requirements are restored to the change that owns them and
  modified by later changes in their own deltas.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `bridge-core`: the Session check's signed-out rule and WHOOP's two
  booleans (modifying `cheap-session-check`), answers without Session
  secrets, the notices' generated copy in `@kaiord/i18n`.
- `garmin-bridge`: the closed upload bodies and the legacy `ping`.
- `whoop-bridge`: the content script's closed list.
- `spa-bridge-protocol`: no costly check on protocol 1.
- `connection-notices`: per-reason wordings and the no-tab exception in the
  App (adding to `connection-notices-four-fixes`).
- `spa-connections-page`: fix targets that exist.

## Impact

- The five extensions and `packages/_shared/bridge-core` (new masters
  `bridge-answer.js`, `bridge-telemetry.js`), their tests, the privacy
  surface golden unchanged.
- Kaiord App adapters, connections and notices; `@kaiord/i18n`; the docs
  install guide (en, es) and `check-site-links`.
- Store listings, privacy justifications, the privacy policy,
  `check-privacy-policy`, `claims/*.json`.
