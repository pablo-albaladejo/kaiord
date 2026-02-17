import type { Logger } from "@kaiord/core";

export type LoggerType = "pretty" | "structured";

export type LoggerOptions = {
  type?: LoggerType;
  level?: "debug" | "info" | "warn" | "error";
  quiet?: boolean;
};

/**
 * Detects if the current environment is a CI/CD environment
 */
const isCI = (): boolean => {
  return (
    process.env.CI === "true" ||
    process.env.NODE_ENV === "production" ||
    !process.stdout.isTTY
  );
};

/**
 * Creates a logger based on environment and options
 *
 * @param options - Logger configuration options
 * @returns Logger instance compatible with @kaiord/core
 */
export const createLogger = async (
  options: LoggerOptions = {}
): Promise<Logger> => {
  // Determine logger type
  const loggerType = options.type || (isCI() ? "structured" : "pretty");

  // Import appropriate logger dynamically
  if (loggerType === "structured") {
    const { createStructuredLogger } =
      await import("../adapters/logger/structured-logger");
    return createStructuredLogger(options);
  } else {
    const { createPrettyLogger } =
      await import("../adapters/logger/pretty-logger");
    return createPrettyLogger(options);
  }
};
