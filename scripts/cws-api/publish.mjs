// Publish an uploaded CRX. POST without body to /items/<id>/publish.
// Returns { status: [string] } per Google docs. 409 → conflict (a
// concurrent publish is locking the item).
//
// Idempotency contract (Assumption A1 — Tier 2 use):
//   publishItem(id, { trustedTesters: false }) is safe to call multiple
//   times against an already-uploaded draft. Google returns HTTP 200 and
//   does NOT re-trigger a new upload or increment the review queue entry.
//   Callers may therefore retry publish without a preceding upload step
//   when the workflow detects an in-flight draft (STUCK_DRAFT status).
//   This contract is Tier 2 (empirically observed, not formally documented
//   in the CWS REST API reference); treat unexpected 4xx as a signal that
//   the assumption no longer holds and escalate to a human.

import { CwsAuthError, CwsStateError } from "./errors.mjs";
import { mintAccessToken } from "./auth.mjs";
import { CWS_API_BASE_URL } from "./state.mjs";

export async function publishItem(
  serviceAccount,
  id,
  { trustedTesters = false } = {}
) {
  const token = await mintAccessToken(serviceAccount);
  const target = trustedTesters ? "trustedTesters" : "default";
  const url =
    `${CWS_API_BASE_URL}/items/${encodeURIComponent(id)}/publish` +
    `?publishTarget=${target}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-goog-api-version": "2",
      "content-length": "0",
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new CwsAuthError(`publishItem returned ${res.status}`);
  }
  if (res.status === 409) {
    throw new CwsStateError("publishItem returned 409 (item locked)");
  }
  if (res.status === 429) {
    throw new CwsStateError("publishItem returned 429 (rate limited)");
  }
  if (!res.ok) {
    throw new CwsStateError(`publishItem returned ${res.status}`);
  }
  const body = await parseJsonOrThrow(res);
  return {
    status: Array.isArray(body.status) ? body.status : [],
    statusDetail: Array.isArray(body.statusDetail) ? body.statusDetail : [],
    rawResponse: body,
  };
}

async function parseJsonOrThrow(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new CwsStateError(
      `publishItem body is not valid JSON (length=${text.length})`
    );
  }
}
