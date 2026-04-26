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
    // Real failure: itemError populated. Throw with details.
    if (draft.itemError && draft.itemError.length > 0) {
      throw new CwsStateError(
        `upload itemError: ${JSON.stringify(draft.itemError)}`
      );
    }
    // Still uploading: keep polling.
    if (draft.uploadState === "IN_PROGRESS") return null;
    // Anything else (SUCCESS, UPLOADED, null/empty, unknown): accept as
    // terminal. The upload PUT already confirmed receipt; the wait here
    // is a defensive double-check that we are no longer mid-upload.
    // wait-published is the authoritative end-to-end gate.
    return draft;
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
