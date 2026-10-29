import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { Log } from "./content-free-log";

/** The Workers Rate Limiting binding's own shape. */
export type RateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

export type HandlerDeps = {
  /** Absent when the binding is not wired: the Worker then never answers 429. */
  readonly rateLimiter?: RateLimiter;
  readonly buildServer?: () => McpServer;
  readonly log?: Log;
};
