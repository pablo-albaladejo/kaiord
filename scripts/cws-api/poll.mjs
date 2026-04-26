// Polling helpers. pollUntil is a generic single-shot helper; the
// retry-once policy for wait-uploaded lives in this module's wrapper
// (NOT inside pollUntil) so wait-published can share pollUntil without
// inheriting the retry behavior.

import { CwsTimeoutError } from "./errors.mjs";
import { getItem } from "./state.mjs";

export async function pollUntil(
  predicate,
  { timeoutMs, intervalMs = 2000, sleep = defaultSleep, now = Date.now } = {}
) {
  const deadline = now() + timeoutMs;
  for (;;) {
    const value = await predicate();
    if (value) return value;
    if (now() >= deadline) {
      throw new CwsTimeoutError(`pollUntil exceeded ${timeoutMs}ms`);
    }
    await sleep(intervalMs);
  }
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitUploaded(
  serviceAccount,
  id,
  { timeoutMs = 60000, sleep, now } = {}
) {
  const predicate = async () => {
    const draft = await getItem(serviceAccount, id, "DRAFT");
    // Standard upload-complete states.
    if (draft.uploadState === "SUCCESS" || draft.uploadState === "UPLOADED") {
      return draft;
    }
    // Still in progress: keep polling.
    if (draft.uploadState === "IN_PROGRESS") return null;
    // Other states (FAILURE, null, unknown): check if the published
    // version already matches what we just uploaded. CWS does not create
    // a new draft when the upload's version equals the currently-live
    // one — the upload PUT returns SUCCESS but the DRAFT projection
    // never transitions. Treat that as a successful no-op.
    const published = await getItem(serviceAccount, id, "PUBLISHED");
    if (published.uploadState === "PUBLISHED" || published.crxVersion) {
      return { ...published, alreadyLive: true };
    }
    return null;
  };
  const opts = { timeoutMs, sleep, now };
  try {
    return await pollUntil(predicate, opts);
  } catch (err) {
    if (!(err instanceof CwsTimeoutError)) throw err;
    // Retry-once internal to wait-uploaded only.
    return await pollUntil(predicate, opts);
  }
}

export async function waitPublished(
  serviceAccount,
  id,
  { version, timeoutMs = 120000, sleep, now = Date.now } = {}
) {
  const start = now();
  const deadline = start + timeoutMs;
  for (;;) {
    const item = await getItem(serviceAccount, id, "PUBLISHED");
    const rejected = isRejected(item);
    if (rejected) {
      return { status: "REJECTED", version, raw: item.rawResponse };
    }
    if (item.crxVersion === version || item.uploadState === "PUBLISHED") {
      return { status: "PUBLISHED", version, raw: item.rawResponse };
    }
    if (item.uploadState === "IN_REVIEW" || item.uploadState === "PENDING") {
      return { status: "IN_REVIEW", version, raw: item.rawResponse };
    }
    if (now() >= deadline) {
      return { status: "TIMEOUT", version, raw: item.rawResponse };
    }
    await (sleep ?? defaultSleep)(2000);
  }
}

function isRejected(item) {
  if (item.uploadState === "FAILURE") return true;
  if (item.uploadState === "REJECTED") return true;
  if (
    item.itemError &&
    item.itemError.some(
      (e) =>
        e?.error_code === "ITEM_REJECTED" ||
        (typeof e?.error_detail === "string" && /reject/i.test(e.error_detail))
    )
  ) {
    return true;
  }
  return false;
}
