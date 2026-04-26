# Chrome Web Store Service-Account Setup & Rotation

This runbook documents the manual Google Cloud + Chrome Web Store steps required to set up (or rotate) the service-account credentials used by `cws-publish.yml` to publish extensions to the Chrome Web Store.

The CI side is fully automated; only the credential lifecycle requires a human (Google's OAuth flow doesn't support fully unattended setup).

> **Why service accounts and not OAuth refresh tokens?** Refresh tokens expire silently (~6-month inactivity window), revoke on Google-side security events, and can only be renewed via an interactive browser flow. Service-account JSON keys do not auto-expire — rotation is on our cadence, not Google's. See `openspec/specs/cws-auto-publish/spec.md` for the spec.

---

## One-time setup (~15 min happy path, up to 45 min cold-start)

### 1. Google Cloud project

1. Open https://console.cloud.google.com.
2. Create or select a project dedicated to CWS automation. Suggested name: `kaiord-cws-publisher`. Note the project ID.
3. No APIs need to be enabled — the Chrome Web Store API call uses the service account directly.

### 2. Service account

1. Navigate to **IAM & Admin → Service Accounts → + Create service account**.
2. Name: `kaiord-cws-publisher`. The email becomes `kaiord-cws-publisher@<project-id>.iam.gserviceaccount.com`.
3. **Skip** the optional "Grant this service account access to the project" step — it does NOT need any project-level IAM role. Authority comes solely from the Chrome Web Store Developer Dashboard linkage in step 3.

### 3. JSON key

1. Open the new service account → **Keys** tab → **Add Key → Create new key → JSON**.
2. Download the file. Treat it as a credential — anyone with it can publish to your CWS items.
3. **Do NOT commit it.** Paste it once into the GitHub Secret in step 5; you can shred the file afterward.

### 4. Chrome Web Store Developer Dashboard linkage

1. Open https://chrome.google.com/webstore/devconsole.
2. **Settings → Service accounts → Add account**.
3. Paste the service-account email from step 2.
4. Confirm. The dashboard now reports the service account as having publish authority on items owned by your publisher account.
5. Google's documented limit: **one service account per publisher**. If you ever need to migrate to a different one, you must remove the existing entry first.

### 5. Repo Secret

1. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
2. Name: `CWS_SERVICE_ACCOUNT_KEY`.
3. Value: paste the entire JSON file contents from step 3 (literal JSON, no base64).
4. Click **Add secret**.
5. Confirm `CWS_EXTENSION_ID` and `CWS_TRAIN2GO_EXTENSION_ID` are still present (they are reused, unchanged).

### 6. Verify

1. Trigger `cws-publish.yml` via **Actions → CWS Publish → Run workflow** (`workflow_dispatch`, leave `force_upload` default-`false`).
2. The pre-flight job should pass within ~10 s.
3. If pre-flight FAILS with `[CwsAuthError]`, re-check step 4 (linkage) and step 5 (secret pasted as full JSON, no truncation).

### 7. Decommission OAuth (after E2E green)

Once you've observed at least one fully-green publish run end-to-end, delete the legacy secrets from **Settings → Secrets and variables → Actions**:

- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`

The workflow no longer references them; their continued presence is just clutter and a tempting target.

---

## Key rotation (optional, security best practice)

Service-account keys do not expire automatically. Rotate them when:

- A security event suggests the key may be compromised (a leaked secret, lost laptop, ex-employee with prior access, etc.).
- Annual cadence as a hygiene policy (optional — not required by Google or by this repo's spec).

Procedure:

1. In Google Cloud Console → service-account → **Keys** tab → create a new JSON key (do NOT delete the old one yet).
2. Update the `CWS_SERVICE_ACCOUNT_KEY` GitHub Secret with the new JSON.
3. Trigger `cws-publish.yml` via `workflow_dispatch` (no force_upload). Pre-flight must pass with the new key.
4. Once the new key is verified working, return to Google Cloud Console and **delete** the old key.

The Chrome Web Store Developer Dashboard linkage is per-service-account-email, NOT per-key; rotating the JSON key does not require re-linking.

---

## Emergency re-publish (`force_upload: true`)

When a published CRX is known-bad (silent build regression, credential leak in a shipped bundle, post-publish malware-scan rejection), normal idempotency would skip re-uploading the same version. To force re-upload:

1. **Actions → CWS Publish → Run workflow**.
2. Set `force_upload: true`.
3. Click **Run workflow**.

The state-check step is bypassed; upload runs unconditionally; publish + wait-published proceed as normal.

> **DO NOT** wire `force_upload: true` into another workflow's automation (`release.yml`, `retry.yml`, etc.) as a default input. It is a human-gated emergency override, NOT a knob for upstream pipelines. If an upstream workflow needs to call CWS Publish, do so without `force_upload` and let the idempotency guard work as designed.

---

## Compromised-key response

If you suspect the JSON key is compromised (e.g., it was posted publicly, a laptop with the file was stolen):

1. **REVOKE FIRST.** Open Google Cloud Console → service account → Keys tab → delete the compromised key. Do NOT wait to generate a replacement first; revocation is the urgent step.
2. After revocation, the next `cws-publish.yml` run's pre-flight will fail with `[CwsAuthError]` and auto-open a `cws-auth-broken` issue. This is expected.
3. Generate a new JSON key (Keys tab → Add Key → Create new key → JSON).
4. Update `CWS_SERVICE_ACCOUNT_KEY` with the new JSON contents.
5. Audit recent publish activity in the Chrome Web Store Developer Dashboard (Items → click each → Submissions tab) for unauthorized version uploads from the time the key may have been compromised.
6. Trigger `cws-publish.yml` via `workflow_dispatch` to confirm the new key works end-to-end.
7. Close the auto-opened `cws-auth-broken` issue.

---

## What this replaces

Prior to this migration, the repo authenticated to Chrome Web Store via OAuth user-delegated refresh tokens — three secrets (`CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`) plus a manual browser-based renewal procedure every ~6 months. That model is gone. The runbook for it has been removed.

If, for any reason, you need to roll back to the old OAuth path:

1. `git revert` the commit that landed `harden-cws-publish`.
2. Restore the three OAuth secrets.
3. The previous workflow YAML works against the same CWS API.

Both auth methods authenticate against `chromewebstore/v1.1` — they differ only in how the access token is minted.
