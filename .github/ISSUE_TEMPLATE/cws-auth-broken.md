---
name: CWS authentication broken
about: Auto-opened when the CWS Publish workflow detects a 401/403 from the service-account credentials
title: "CWS authentication broken"
labels: cws-auth-broken
assignees: pablo-albaladejo
---

The Chrome Web Store API rejected our service-account credentials with 401 / 403.

## Likely causes

- Service-account JSON key was rotated/revoked in Google Cloud Console.
- The service account was unlinked from the Chrome Web Store Developer Dashboard (Settings → Service accounts).
- Google rotated the OAuth signing keys and the cache is stale (rare, self-healing).

## Fix checklist

- [ ] Check Google Cloud Console → IAM & Admin → Service Accounts: is the `kaiord-cws-publisher` account present? Are its keys valid and unrevoked?
- [ ] If a fresh key is needed: follow [`docs/runbooks/cws-service-account.md`](../../docs/runbooks/cws-service-account.md) → "Key rotation".
- [ ] Update repo Secret `CWS_SERVICE_ACCOUNT_KEY` with the new JSON key contents.
- [ ] Trigger `cws-publish.yml` via `workflow_dispatch` to verify pre-flight passes.
- [ ] Close this issue once a green run is observed.

## Observed error

(Paste the relevant `[CwsAuthError]` line from the failing workflow run here.)
