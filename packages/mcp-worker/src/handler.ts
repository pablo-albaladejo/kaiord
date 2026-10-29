import type { HandlerDeps, RateLimiter } from "./deps";
import { MAX_BODY_BYTES, MCP_PATH } from "./limits";
import { parseMessage } from "./parse-message";
import { readBoundedBody } from "./read-bounded-body";
import {
  methodNotAllowed,
  notFound,
  payloadTooLarge,
  tooManyRequests,
} from "./responses";
import { serveMcp } from "./serve-mcp";

const CLIENT_IP_HEADER = "cf-connecting-ip";
const UNKNOWN_CLIENT = "unknown";

const isOverLimit = async (
  request: Request,
  rateLimiter: RateLimiter | undefined
): Promise<boolean> => {
  if (rateLimiter === undefined) return false;
  const key = request.headers.get(CLIENT_IP_HEADER) ?? UNKNOWN_CLIENT;
  const { success } = await rateLimiter.limit({ key });
  return !success;
};

export const handleRequest = async (
  request: Request,
  deps: HandlerDeps = {}
): Promise<Response> => {
  if (new URL(request.url).pathname !== MCP_PATH) return notFound();
  if (request.method !== "POST") return methodNotAllowed();
  if (await isOverLimit(request, deps.rateLimiter)) return tooManyRequests();

  const body = await readBoundedBody(request, MAX_BODY_BYTES);
  if (body === null) return payloadTooLarge(MAX_BODY_BYTES);

  const parsed = parseMessage(body);
  if (!parsed.ok) return parsed.response;
  return serveMcp(request, parsed.message, deps);
};
