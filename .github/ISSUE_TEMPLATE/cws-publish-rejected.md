---
name: CWS publish rejected
about: Auto-opened when the Chrome Web Store rejects a published version
title: "CWS publish rejected: <ext>@<version>"
labels: cws-publish-rejected
assignees: pablo-albaladejo
---

Chrome Web Store **rejected** the publish attempt. This is a human-actionable policy / validation error — the workflow matrix job FAILED so subsequent releases do not silently ship over an unresolved rejection.

## itemError payload

(Paste the `itemError` array from the workflow's `wait-published` stdout here.)

Reference: [Chrome Web Store item-error code documentation](https://developer.chrome.com/docs/webstore/api/items#error-codes).

## Fix checklist

- [ ] Read the `itemError` payload — it usually pinpoints the exact policy / manifest / content issue.
- [ ] Address the root cause in the extension code, manifest, or store listing.
- [ ] Decide between bumping the version (preferred — cleaner CWS history) OR force-publishing the same version.
  - If bumping version: edit `packages/<ext>/package.json` and merge a new release.
  - If force-publishing same version: see [`docs/runbooks/cws-service-account.md`](../../docs/runbooks/cws-service-account.md) → "Emergency re-publish".
- [ ] Confirm the new run reaches `PUBLISHED` end-to-end.
- [ ] Close this issue.
