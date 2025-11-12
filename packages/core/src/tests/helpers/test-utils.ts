import type { Logger } from "../../ports/logger";

export const createMockLogger = (): Logger => ({
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
});
