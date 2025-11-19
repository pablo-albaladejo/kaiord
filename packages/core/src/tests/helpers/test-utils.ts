import type { Logger } from "../../ports/logger";

export const createMockLogger = (): Logger => ({
  debug: (...args: unknown[]) => {
    if (process.env.DEBUG_LOGS) console.log("[DEBUG]", ...args);
  },
  info: (...args: unknown[]) => {
    if (process.env.DEBUG_LOGS) console.log("[INFO]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (process.env.DEBUG_LOGS) console.log("[WARN]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },
});
