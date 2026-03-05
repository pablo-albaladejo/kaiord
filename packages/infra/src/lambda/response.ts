import type { APIGatewayProxyResultV2 } from "aws-lambda";

export const jsonResponse = (
  statusCode: number,
  body: unknown
): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const errorResponse = (
  statusCode: number,
  message: string
): APIGatewayProxyResultV2 => jsonResponse(statusCode, { error: message });
