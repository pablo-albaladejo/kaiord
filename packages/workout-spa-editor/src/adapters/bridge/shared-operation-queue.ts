/**
 * Shared per-bridge `OperationQueue` singleton.
 *
 * The SPA Bridge Protocol caps each bridge at 60 ops per rolling hour.
 * Every queue consumer (profile-snapshot push/clear, Train2Go zones-sync)
 * MUST enqueue against THIS instance so the counter is shared — otherwise
 * each consumer would get its own 60/h budget and the ceiling would be
 * `60 * consumer-count`.
 *
 * `delayMs = 0` matches the existing snapshot-push behaviour (no
 * artificial inter-op delay; the queue's exponential backoff still
 * applies on 429 responses).
 */
import { createOperationQueue } from "./operation-queue";

export const BRIDGE_QUEUE = createOperationQueue(0);
