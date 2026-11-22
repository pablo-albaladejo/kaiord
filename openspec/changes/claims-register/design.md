## Context

A public claim is a sentence a reader sees: in a store listing, a permission
justification, a privacy text, later the landing and the READMEs. Six later
tickets add surfaces, often in parallel.

## Decisions

### D1. Every visible unit is a claim, matched by exact text

- **A.** Inline markers (`<!-- claim:id -->`) after each claim: an agent adds a
  sentence without a marker and nothing notices.
- **B.** A list of "claim" sentences the guard looks for: same hole, the guard
  only sees what it was told about.
- **C.** Treat every unit of text on a registered surface as a claim, and
  require each one to equal the `text` of a register entry.

C is chosen. It needs no marker and no judgement about what counts as a
claim, so an unproven sentence cannot be added, and a proven one cannot be
reworded, without the guard failing. The price is that headings and labels
are entries too; they may point to the surface file itself. Whitespace is
collapsed so re-wrapping is free.

### D2. A proof must still exist, as specifically as possible

A proof is a file, the same file still holding a given text (pinning the
code), a running test by its exact title (a skipped one proves nothing), or
an https endpoint (not fetched, so the guard stays hermetic; a kaiord.com
URL names the repo file that serves it). Unknown fields fail so a typo cannot
pass. Whether the proof proves the sentence is still review's job.

### D3. One file per group of surfaces

`claims/<group>.json`, so parallel tickets edit different files. A surface
and a claim id belong to one file only, so two files cannot disagree.

### D4. Tokens never travel to Kaiord, proven at the message contract

`token-confinement.test.js` mints four distinct secrets through a fake Garmin,
runs every external action from the App origin (with Garmin answering and
refusing), and asserts that no answer carries a secret, that the tokens sit
in `chrome.storage.local`, and that every request goes to `sso.garmin.com` or
`connectapi.garmin.com`.

### D5. Existing guards keep their teeth

The privacy-policy Garmin heading becomes "Kaiord for Garmin Extension":
`GARMIN_SECTION` and the bridge-heading pattern of the no-analytics exemption
follow it; the 14 Garmin rules and their floor are unchanged. The privacy
surface golden is untouched: no manifest, allowlist or action changed.
