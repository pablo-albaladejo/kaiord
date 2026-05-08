/**
 * Test fixtures for operation-queue.test.ts.
 * Pure constants — no logic, no functions.
 */

export const OPERATION_QUEUE_BRIDGE = {
  defaultId: "b1",
} as const;

export const OPERATION_QUEUE_DELAYS_MS = {
  none: 0,
  short: 10,
  serializeWindow: 50,
  delayBetween: 500,
  delayBetweenWindow: 1_200,
  retryWindow: 2_100,
  exhaustWindow: 70_000,
  hourMs: 60 * 60 * 1_000,
} as const;

export const OPERATION_QUEUE_RATE = {
  hourlyLimit: 60,
  maxRetries: 5,
} as const;

export const OPERATION_QUEUE_RESULTS = {
  fortyTwo: 42,
  ok: "ok",
  success: "success",
  one: 1,
  two: 2,
} as const;

export const OPERATION_QUEUE_ERRORS = {
  rateLimit: "Rate limit reached",
  tooMany: "Too Many",
  network: "Network failure",
  status429: 429,
} as const;
