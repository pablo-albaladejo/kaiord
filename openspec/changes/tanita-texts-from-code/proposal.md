## Why

Issue #1627 (parent #1670, "Only what is real is said", stories 58, 59, 66,
67). The Tanita extension has never been published, and its texts were not
true. The privacy policy said "nothing is written to `chrome.storage`" while
the popup writes `bridgeHealth` and the service worker writes `kaiordTheme`;
the permission justification reserved `storage` for "last-sync bookkeeping"
that does not exist; and no text said that opening the popup downloads the
athlete's whole MyTANITA export just to learn whether it can reach it.

## What Changes

- **Texts from the code.** The Short and Detailed Description of
  `packages/tanita-bridge/store-listing.md`, `extDescription`, the whole of
  `privacy-justification.md` and the Tanita section of the privacy policy are
  rewritten from what the code does today, ready for a first publish (nothing
  is published). They say that every check downloads the whole export, what is
  stored and where, and that access is unofficial. Athlete-facing prose says
  "Kaiord for Tanita"; the extension's name is unchanged. English only (#1646).
- **Proven.** Every sentence is registered in `claims/tanita.json`. New tests:
  `test/export-confinement.test.js` (requests go only to the export, a session
  check downloads the whole export and answers only yes or no, the export is
  handed over unchanged, the service worker stores only the theme) and two
  popup tests (every open and Refresh checks; the popup records only the
  health stamps).
- **Policy section renamed** "Kaiord for Tanita Extension";
  `check-privacy-policy` follows it and gains two rules (the check downloads
  the export; what `chrome.storage.local` holds), floor 11 → 13.
- **Register ownership per section.** `check-claims` let one register file
  own a whole file, so the policy (already a Garmin surface) could not take a
  Tanita section in `tanita.json`. A whole file, and each named section or key,
  now belongs to one register file; different sections of one file may sit in
  different register files.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `privacy-policy`: the Tanita section's disclosures.
- `public-claims`: surface ownership per section or key (the capability lands
  with `claims-register`).

## Impact

- `@kaiord/tanita-bridge` (private): texts, `extDescription`, tests. No code,
  manifest, allowlist or action changed, so the privacy surface golden is
  untouched. The behaviour the texts describe (a check downloads the export)
  is changed by #1643, which must update these texts and their proofs.
- `@kaiord/docs`: policy section, `check-privacy-policy` and its test.
- `scripts/check-claims.mjs` and its test, `claims/README.md`.
