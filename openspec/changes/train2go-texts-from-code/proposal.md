## Why

Review of 2026-11-22, issue #1626 (parent #1670, "Only what is real is said",
stories 58, 59, 66, 67). Kaiord for Train2Go's store listing, permission
justifications, privacy-practices file and privacy-policy section still
described the extension before it moved to service-worker requests: a `tabs`
and a `scripting` permission it does not declare, a content script reading the
Train2Go page DOM, "no network requests", "stores no data locally", and a
promise never to transmit the coach's name or notes, which every connection
check passes to the Kaiord App. The listing sent athletes to "Profile Manager
→ Linked Accounts" and "Sync zones", labels the App does not have. Some of
these false sentences were pinned by `check-privacy-policy` itself.

## What Changes

- **Texts from the code.** The Short and Detailed Description of
  `packages/train2go-bridge/store-listing.md`, `extDescription`, the whole of
  `privacy-justification.md` and the Train2Go section of the privacy policy
  are rewritten from what the extension does today, and registered in the new
  `claims/train2go.json`. The athlete-facing name is "Kaiord for Train2Go";
  the extension's own name is unchanged (#1646). English only.
- **Proofs.** New `test/request-confinement.test.js`: every request goes to
  `app.train2go.com` with the browser's cookies and no other credential, only
  `GET`; `chrome.storage.local` holds popup state only; every connection check
  hands the App the coach's name and notes; only scripts in the package run.
- **One privacy form, not two.** `cws-privacy-practices.txt` is deleted; its
  single purpose and remote-code answers move into the registered
  `privacy-justification.md`.
- **Policy guard follows the truth.** The section heading becomes "Kaiord for
  Train2Go Extension"; the three Train2Go rules that required false sentences
  (page-DOM read, nothing in `chrome.storage`, no-DOM mutation wording) are
  replaced by rules pinning what is true, and four rules are added (no script
  on Train2Go pages, coach name and notes disclosed, profile page limited to
  zones and weight, storage disclosed). Floor 8 → 11.
- **Register.** Different sections of one shared file may be owned by
  different register files, so the privacy policy can carry a Garmin and a
  Train2Go surface. Whole-file overlap and the same section twice still fail.

## Capabilities

### Modified Capabilities

- `public-claims`: section-level ownership of a shared surface; Train2Go texts
  registered.
- `cws-train2go-listing`: listing and justification are registered surfaces;
  the privacy-practices file is removed.
- `privacy-policy`: the Train2Go disclosure and the section-heading pattern.

## Impact

- `@kaiord/train2go-bridge` (private): texts, `extDescription`, a new test,
  one file removed. No code changed, nothing published: the description
  reaches the store only with the next version bump, and dashboard texts are
  pasted by hand.
- `@kaiord/docs`: Train2Go policy section and its rules.
- `scripts/check-claims.mjs` and its test; `claims/train2go.json`.
- Out of scope: the store screenshot (needs a capture), the stale canonical
  `train2go-bridge` spec (content-script era), the policy intro sentence.
