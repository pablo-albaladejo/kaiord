// Publish an uploaded CRX. POST without body to /items/<id>/publish.
// Returns { status: [string] } per Google docs. 409 → conflict (a
// concurrent publish is locking the item).

import { CwsAuthError, CwsStateError } from "./errors.mjs";
import { mintAccessToken } from "./auth.mjs";
import { CWS_API_BASE_URL } from "./state.mjs";

export async function publishItem(
  serviceAccount,
  id,
  { trustedTesters = false } = {},
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
      `publishItem body is not valid JSON (length=${text.length})`,
    );
  }
}
