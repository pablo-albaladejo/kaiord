/**
 * The narrow persistence surface the lab mutation use cases need: the lab
 * repository plus the atomic `transaction` runner. Taking a `Pick` (not the
 * whole port) keeps the use cases decoupled and lets tests supply a minimal
 * `{ labs, transaction }` stub for the in-memory contract arm.
 */
import type { PersistencePort } from "../../ports/persistence-port";

export type LabPersistence = Pick<PersistencePort, "labs" | "transaction">;
