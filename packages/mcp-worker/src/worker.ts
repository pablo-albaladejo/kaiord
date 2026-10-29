// Must stay the first import: see load-at-startup.ts.
import "./load-at-startup";

import type { RateLimiter } from "./deps";
import { handleRequest } from "./handler";

export type Env = {
  /** Bound only if task 3.3 finds the Rate Limiting binding on Free. */
  readonly MCP_RATE_LIMITER?: RateLimiter;
};

export default {
  fetch: (request: Request, env: Env): Promise<Response> =>
    handleRequest(request, { rateLimiter: env.MCP_RATE_LIMITER }),
};
