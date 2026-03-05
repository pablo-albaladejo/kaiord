import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { pushRequestSchema } from "./request-schema";
import { pushToGarmin } from "./garmin-push";
import { errorResponse, jsonResponse } from "./response";

export const handler = async (event: APIGatewayProxyEventV2) => {
  if (!event.body) {
    return errorResponse(400, "Request body is required");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(event.body);
  } catch {
    return errorResponse(400, "Invalid JSON in request body");
  }

  const validation = pushRequestSchema.safeParse(parsed);
  if (!validation.success) {
    return errorResponse(400, "Invalid request: check KRD and credentials");
  }

  const { krd, garmin } = validation.data;

  try {
    const result = await pushToGarmin(krd as never, garmin);
    return jsonResponse(200, result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isAuthError =
      message.includes("authentication") ||
      message.includes("Login failed") ||
      message.includes("locked");

    if (isAuthError) {
      return errorResponse(401, "Garmin authentication failed");
    }
    return errorResponse(500, `Garmin API error: ${message}`);
  }
};
