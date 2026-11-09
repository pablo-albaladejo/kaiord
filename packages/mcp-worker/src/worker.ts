// Must stay the first import: see load-at-startup.ts.
import "./load-at-startup";

import type { RateLimiter } from "./deps";
import { handleRequest } from "./handler";

export type Env = {
  /**
   * Per-IP rate limit (`[[ratelimits]]` in wrangler.toml). Unset in unit tests.
   * `wrangler dev` simulates it from the same config, so local requests can 429.
   */
  readonly MCP_RATE_LIMITER?: RateLimiter;
};

export default {
  fetch: (request: Request, env: Env): Promise<Response> =>
    handleRequest(request, { rateLimiter: env.MCP_RATE_LIMITER }),
};
