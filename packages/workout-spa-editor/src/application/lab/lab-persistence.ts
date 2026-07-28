/**
 * The narrow persistence surface the lab mutation use cases need: the lab
 * repository, the tombstone repository (the lab delete records its own
 * cross-device delete markers — the decorator cannot reach `deleteReport` /
 * `deleteValuesByReport`), plus the atomic `transaction` runner. Taking a
 * `Pick` (not the whole port) keeps the use cases decoupled and lets tests
 * supply a minimal `{ labs, tombstones, transaction }` stub for the in-memory
 * contract arm.
 */
import type { PersistencePort } from "../../ports/persistence-port";

export type LabPersistence = Pick<
  PersistencePort,
  "labs" | "tombstones" | "transaction"
>;
