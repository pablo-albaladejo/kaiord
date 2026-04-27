---
name: CWS publish verification timeout
about: Auto-opened when post-publish polling times out without reaching PUBLISHED
title: "CWS publish stalled: <ext>@<version>"
labels: cws-publish-verification-timeout
---

The CWS Publish workflow polled the Chrome Web Store API for up to 2 minutes after publish dispatch and did NOT observe the new version transition to `PUBLISHED`.

This is **non-blocking** — the workflow exited 0. The extension may simply be in Google's manual review queue (`IN_REVIEW`), which is a legitimate terminal state and typically self-resolves within hours-to-days. This issue exists for visibility and audit.

## What to check

- Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) and inspect the affected extension. If it shows `Pending review`, no action is required.
- If it shows `Rejected` instead, the verification logic may have missed it — open a separate `cws-publish-rejected` issue manually.
- If the version is now `PUBLISHED` (the timeout simply ran out before propagation completed), close this issue.

## Last-seen CWS state payload

(Paste the JSON `raw` field from the workflow's `wait-published` stdout here.)

## Auto-recovery

Future workflow runs will skip the upload step (CWS API state is the idempotency source of truth) and proceed straight to publish if the upload is still in `UPLOADED` state. No manual intervention needed for routine review queues.
