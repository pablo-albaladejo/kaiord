/**
 * R-CapabilityDecisionThroughReadApi: a file that reads the athlete's
 * Capability decisions (the store's `listByProfile`, or the Dexie table by
 * name) resolves them through the read API, so `application/` cannot decide
 * on its own whether a Capability is on. The store's own plumbing is
 * declared with a reason (`DECISIONS.storage` in the vocab).
 */

import { readsApi } from "./capability-read-api.mjs";

const readsDecisions = (file, store) =>
  file.accesses.has(`${store}.listByProfile`) || file.tables.has(store);

export function checkDecisions(files, vocab) {
  const { store, storage } = vocab.DECISIONS;
  return files
    .filter((file) => !(file.path in storage))
    .filter((file) => readsDecisions(file, store) && !readsApi(file, vocab))
    .map((file) => ({
      rule: "R-CapabilityDecisionThroughReadApi",
      file: file.path,
      detail: `reads ${store} without resolving them through the read API`,
    }));
}
