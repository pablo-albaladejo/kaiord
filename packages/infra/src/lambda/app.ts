import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { requestId } from "hono/request-id";
import type { MiddlewareHandler } from "hono";
import { pushRequestSchema } from "./request-schema";
import { pushToGarmin } from "./garmin-push";

const MAX_BODY_BYTES = 512_000;

export const isAuthError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  if (error.name === "ServiceAuthError") return true;
  const msg = error.message;
  return (
    msg.includes("authentication") ||
    msg.includes("Login failed") ||
    msg.includes("locked")
  );
};

export const isRateLimited = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : "";
  return msg.includes("429") || msg.includes("Too Many Requests");
};

const passthrough: MiddlewareHandler = async (_c, next) => next();

type AppOptions = {
  onBeforePush?: MiddlewareHandler;
  middleware?: MiddlewareHandler[];
};

export const createApp = (options?: AppOptions) => {
  const app = new Hono();

  for (const mw of options?.middleware ?? []) app.use("*", mw);
  app.use("*", requestId());

  app.get("/health", (c) => c.json({ status: "ok" }));

  app.post(
    "/push",
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: (c) => c.json({ error: "Payload too large" }, 413),
    }),
    options?.onBeforePush ?? passthrough,
    async (c) => {
      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json(
          { error: "Invalid request: check KRD and credentials" },
          400
        );
      }
      const validation = pushRequestSchema.safeParse(body);
      if (!validation.success) {
        return c.json(
          { error: "Invalid request: check KRD and credentials" },
          400
        );
      }

      const reqId = c.get("requestId");
      try {
        const result = await pushToGarmin(
          validation.data.krd,
          validation.data.garmin
        );
        return c.json(result, 200);
      } catch (error: unknown) {
        if (isAuthError(error)) {
          console.error("Garmin auth failed", {
            requestId: reqId,
            errorType:
              error instanceof Error ? error.constructor.name : "unknown",
            errorMessage:
              error instanceof Error ? error.message.slice(0, 200) : "unknown",
          });
          return c.json({ error: "Garmin authentication failed" }, 401);
        }
        if (isRateLimited(error)) {
          return c.json({ error: "Garmin rate limited, try again later" }, 429);
        }
        console.error("Garmin push failed", {
          requestId: reqId,
          errorType:
            error instanceof Error ? error.constructor.name : "unknown",
          errorMessage:
            error instanceof Error ? error.message.slice(0, 100) : "unknown",
        });
        return c.json({ error: "Garmin API error" }, 500);
      }
    }
  );

  return app;
};
