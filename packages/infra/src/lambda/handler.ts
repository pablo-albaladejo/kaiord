import { handle } from "hono/aws-lambda";
import type { MiddlewareHandler } from "hono";
import { createApp } from "./app";
import { checkTunnelHealth, enableSocksProxy } from "./proxy-fetch";

const useTailscale = (): boolean => Boolean(process.env.TS_SECRET_API_KEY);

const tailscaleMiddleware: MiddlewareHandler = async (c, next) => {
  if (!useTailscale()) return next();

  enableSocksProxy();

  if (!(await checkTunnelHealth())) {
    console.error("Tailscale tunnel unavailable", {
      requestId: c.get("requestId"),
    });
    return c.json({ error: "Proxy tunnel unavailable" }, 503);
  }

  return next();
};

const app = createApp({ onBeforePush: tailscaleMiddleware });

export const handler = handle(app);
