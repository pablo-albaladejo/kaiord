import type { Logger } from "@kaiord/core";

export const createStderrLogger = (): Logger => ({
  debug: (message, context) =>
    console.error(`[DEBUG] ${message}`, context ?? ""),
  info: (message, context) => console.error(`[INFO] ${message}`, context ?? ""),
  warn: (message, context) => console.error(`[WARN] ${message}`, context ?? ""),
  error: (message, context) =>
    console.error(`[ERROR] ${message}`, context ?? ""),
});
