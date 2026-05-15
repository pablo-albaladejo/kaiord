// Chrome Web Store state queries (getItem). Single-endpoint module-level
// constant for the API base — Factor III pragmatic deviation: there is
// only one CWS endpoint globally, no staging tier exists.

import { CwsAuthError, CwsStateError } from "./errors.mjs";
import { mintAccessToken } from "./auth.mjs";
import { readErrorDetail } from "./error-detail.mjs";

export const CWS_API_BASE_URL =
  "https://www.googleapis.com/chromewebstore/v1.1";

// Runbook for operators when getItem throws CwsStateError on a non-OK
// response: docs/runbooks/cws-service-account.md. The thrown message
// embeds the redacted CWS response body so the runbook step can be
// picked directly.
const RUNBOOK = "see docs/runbooks/cws-service-account.md";

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new CwsStateError(
      `response body is not valid JSON (status=${res.status}, length=${text.length})`
    );
  }
}

export async function getItem(serviceAccount, id, projection = "DRAFT") {
  const token = await mintAccessToken(serviceAccount);
  const url = `${CWS_API_BASE_URL}/items/${encodeURIComponent(id)}?projection=${projection}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-goog-api-version": "2",
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new CwsAuthError(`getItem returned ${res.status}`);
  }
  if (!res.ok) {
    const detail = await readErrorDetail(res);
    throw new CwsStateError(
      `getItem(${projection}) returned ${res.status}: ${detail} — ${RUNBOOK}`
    );
  }
  const body = await safeJson(res);
  return normalizeItem(body);
}

function normalizeItem(body) {
  return {
    id: body.id ?? null,
    uploadState: body.uploadState ?? null,
    crxVersion: body.crxVersion ?? null,
    publicKey: undefined,
    itemError: Array.isArray(body.itemError) ? body.itemError : [],
    rawResponse: body,
  };
}
