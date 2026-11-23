## Context

The App and the five extensions each worded a broken Connection on their own.
The extensions are plain unbundled JavaScript that copy a shared core; the App
is TypeScript with en/es dictionaries. The cost of the Session check itself is
#1643, which will make every extension report a typed outcome; Train2Go thin
is #1641; the extensions' Spanish is #1646.

## Decisions

### D1. The single source is a vendored bridge-core master, not a dictionary

`connection-notices.js` is a classic script (a top-level const, plus
`module.exports` for CommonJS) so a popup loads it with `<script src>`, the
bridge suites `require` it, and `@kaiord/i18n` imports it; a sibling `.d.ts`
types it for the App. It holds data and one function (`noticeFor`), so the App
and every popup run the same code on the same table. Rejected: wording in the
App dictionaries plus a copy in each `_locales/en` (seven copies to keep
equal); a JSON file with a renderer per side (two functions that can drift);
generating the extension copy from a TypeScript build (parity would depend on
the bundler's output).

### D2. A state, not a cause, decides the notice

`working` and `checking` show nothing; `not-installed` → Install;
`outdated` → Update; `signed-out` → Sign in to the Platform; `not-answering`
and any state the table does not know → Try again. Only the Platform's own
refusal (`needsReauth`: a redirect, a 401/403, or an extension that holds no
sign-in to lend) is `signed-out`. A failed read, a timeout, a server error or
an extension that did not reply is `not-answering`, whose wording names the
outage and nothing else.

### D3. The typed outcome first, one small adapter for older extensions

An extension with the cheap Session check (#1643) answers `session`
(signed-in / signed-out / not-answering / not-checked), read first by every
probe and every popup. `session-outcome.ts` reads an older extension's own
booleans into the same three outcomes; only the Platform's refusal is
signed-out. "not-checked" (nothing was asked, the first real use decides) is
its own state with no notice, and a send may go ahead on it.

### D4. The protocol version is read from the envelope, and discovery remembers it

Every envelope carries `protocolVersion`, so the probers read it first
against the versions accepted per extension (`bridge-protocol.ts`), for every
bridge (#1098). Discovery still does not register an extension on another
version (thin-bridge-train2go), which made it look absent and the App offered
Install; it now remembers it as outdated (`isOutdated`), and the card and the
Garmin send path show Update.

### D5. The popup and the App read the same answer the same way

Each popup's `connectionStateOf` mirrors the App's reader for that bridge, and
`popup-app-parity.test.ts` feeds the same answers to the shipped `popup.js`
function and to the App's prober, asserting the same notice (#1091). WHOOP now
reads `connected` alone on both sides.

### D6. The guard recognises wordings, with reasoned exceptions

Patterns per fix, English and Spanish, run over the App's dictionaries, the
App's UI source, each extension's `_locales` and `popup.js`. A phrase that
matches without being a Connection notice is listed in
`connection-notices.vocab.mjs` with its reason and its exact place; a listed
phrase no longer there fails too.

### D7. Out of scope, said where it shows

The WHOOP popup's "No WHOOP tab open" state (a held sign-in with no tab to
read through) is not one of the four fixes and the App cannot see it; it is
kept and listed for the owner. The garmin-bridge spec's "Incompatible protocol
is surfaced" scenario belongs to a requirement another active change modifies;
its wording is left to that change.
