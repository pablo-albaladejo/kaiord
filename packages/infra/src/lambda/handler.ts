import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { pushRequestSchema } from "./request-schema";
import { pushToGarmin } from "./garmin-push";
import { checkTunnelHealth } from "./proxy-fetch";
import { errorResponse, jsonResponse } from "./response";
import { ensureExitNode } from "./tailscale-exit-node";

const MAX_BODY_BYTES = 512_000;
const useTailscale = (): boolean => Boolean(process.env.TS_SECRET_API_KEY);

const getBodyBytes = (event: APIGatewayProxyEventV2): number =>
  event.isBase64Encoded
    ? Buffer.byteLength(event.body!, "base64")
    : Buffer.byteLength(event.body!, "utf8");

const isAuthError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : "";
  return (
    msg.includes("authentication") ||
    msg.includes("Login failed") ||
    msg.includes("locked")
  );
};

const isRateLimited = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : "";
  return msg.includes("429") || msg.includes("Too Many Requests");
};

// SECURITY: Never log event.body, credentials, or raw error messages.
// They may contain Garmin username/password from the request payload.
export const handler = async (event: APIGatewayProxyEventV2) => {
  const requestId = event.requestContext?.requestId;

  if (!event.body) {
    return errorResponse(400, "Request body is required");
  }

  if (getBodyBytes(event) > MAX_BODY_BYTES) {
    return errorResponse(413, "Payload too large");
  }

  const parsed = (() => {
    try {
      return JSON.parse(event.body!) as unknown;
    } catch {
      return undefined;
    }
  })();
  if (parsed === undefined) {
    return errorResponse(400, "Invalid JSON in request body");
  }

  const validation = pushRequestSchema.safeParse(parsed);
  if (!validation.success) {
    return errorResponse(400, "Invalid request: check KRD and credentials");
  }

  if (useTailscale()) ensureExitNode();

  if (useTailscale() && !(await checkTunnelHealth())) {
    console.error("Tailscale tunnel unavailable", { requestId });
    return errorResponse(503, "Proxy tunnel unavailable");
  }

  try {
    const result = await pushToGarmin(
      validation.data.krd,
      validation.data.garmin
    );
    return jsonResponse(200, result);
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return errorResponse(401, "Garmin authentication failed");
    }
    if (isRateLimited(error)) {
      return errorResponse(429, "Garmin rate limited, try again later");
    }
    console.error("Garmin push failed", {
      requestId,
      errorType: error instanceof Error ? error.constructor.name : "unknown",
      errorMessage:
        error instanceof Error ? error.message.slice(0, 100) : "unknown",
    });
    return errorResponse(500, "Garmin API error");
  }
};
