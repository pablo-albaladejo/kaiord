## Context

Kaiord for Train2Go moved from a content script reading the Train2Go page to
service-worker requests with the browser's own cookies. Its listing, privacy
form and policy section still described the old extension, and some false
sentences were pinned by `check-privacy-policy` itself.

## Decisions

### D1. Rewrite from the code and prove it with one confinement test

`test/request-confinement.test.js` drives the service worker and observes
what leaves it: every request goes to `app.train2go.com`, only `GET`, with
the browser's cookies and no other credential; `chrome.storage.local` holds
popup state only; every connection check hands the App the coach's name and
notes; only scripts shipped in the package run. Each sentence of the texts
points to one of those tests.

### D2. One privacy form, not two

- **A.** Keep `cws-privacy-practices.txt` beside `privacy-justification.md`:
  two copies of the same answers drift.
- **B.** Move its single-purpose and remote-code answers into the registered
  `privacy-justification.md` and delete it.

B is chosen.

### D3. Section ownership in a shared file

The privacy policy holds one section per extension. A register file may own
some sections of a file another register file also uses, as long as no
section is owned twice and no whole-file surface overlaps them.
