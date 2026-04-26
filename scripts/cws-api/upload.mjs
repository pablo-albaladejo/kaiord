// Upload a CRX zip to Chrome Web Store. PUT body is the raw zip with
// `Content-Type: application/octet-stream`. Returns the parsed CWS
// response { id, uploadState, itemError?, crxVersion? }.

import { createReadStream, statSync } from "node:fs";
import { CwsAuthError, CwsStateError } from "./errors.mjs";
import { mintAccessToken } from "./auth.mjs";

const UPLOAD_BASE_URL =
  "https://www.googleapis.com/upload/chromewebstore/v1.1/items";

export async function uploadCrx(serviceAccount, id, zipPath) {
  const token = await mintAccessToken(serviceAccount);
  const url = `${UPLOAD_BASE_URL}/${encodeURIComponent(id)}`;
  const stats = statSync(zipPath);
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-goog-api-version": "2",
      "Content-Type": "application/octet-stream",
      "Content-Length": String(stats.size),
    },
    body: createReadStream(zipPath),
    duplex: "half",
  });
  if (res.status === 401 || res.status === 403) {
    throw new CwsAuthError(`uploadCrx returned ${res.status}`);
  }
  if (res.status === 429) {
    throw new CwsStateError("uploadCrx returned 429 (rate limited)");
  }
  if (!res.ok) {
    throw new CwsStateError(`uploadCrx returned ${res.status}`);
  }
  const body = await parseJsonOrThrow(res);
  return {
    id: body.id ?? null,
    uploadState: body.uploadState ?? null,
    crxVersion: body.crxVersion ?? null,
    itemError: Array.isArray(body.itemError) ? body.itemError : [],
    rawResponse: body,
  };
}

async function parseJsonOrThrow(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new CwsStateError(
      `uploadCrx body is not valid JSON (length=${text.length})`,
    );
  }
}
