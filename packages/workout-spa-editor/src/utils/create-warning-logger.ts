import type { Logger } from "@kaiord/core";
import { createConsoleLogger } from "@kaiord/core";

/**
 * Console logger that also hands every `warn` to `onWarning`: adapters
 * announce the parts of a file they could not convert through their logger,
 * and this is how those announcements reach the user instead of only the
 * devtools console.
 */
export const createWarningLogger = (
  onWarning?: (message: string) => void
): Logger => {
  const base = createConsoleLogger();
  return {
    ...base,
    warn: (message, context) => {
      base.warn(message, context);
      onWarning?.(message);
    },
  };
};
