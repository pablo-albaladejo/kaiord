import type { Logger } from "@kaiord/core";

/**
 * Creates a console logger for the workout-spa-editor
 * This logger respects NODE_ENV and only logs in development/test environments
 */
export const createLogger = (): Logger => ({
  debug: (message: string, context?: Record<string, unknown>) => {
    if (import.meta.env.MODE !== "production") {
      console.debug(message, context);
    }
  },
  info: (message: string, context?: Record<string, unknown>) => {
    if (import.meta.env.MODE !== "production") {
      console.info(message, context);
    }
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    if (import.meta.env.MODE !== "production") {
      console.warn(message, context);
    }
  },
  error: (message: string, context?: Record<string, unknown>) => {
    // Always log errors, even in production
    console.error(message, context);
  },
});

/**
 * Default logger instance
 */
export const logger = createLogger();
