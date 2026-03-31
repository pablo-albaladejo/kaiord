import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { pushRequestSchema } from "./request-schema";
import { pushToGarmin } from "./garmin-push";
import { errorResponse, jsonResponse } from "./response";

const MAX_BODY_BYTES = 512_000;

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
    console.error("Garmin push failed", {
      requestId,
      errorType: error instanceof Error ? error.constructor.name : "unknown",
    });
    return errorResponse(500, "Garmin API error");
  }
};
