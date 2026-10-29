import { readFileSync } from "node:fs";

import type { HandlerDeps } from "../deps";
import { handleRequest } from "../handler";

export const ENDPOINT = "https://kaiord.com/mcp";
export const ACCEPT = "application/json, text/event-stream";

const FIXTURES = new URL("../../../../test-fixtures/", import.meta.url);

export const fixtureBase64 = (path: string): string =>
  readFileSync(new URL(path, FIXTURES)).toString("base64");

export const fixtureText = (path: string): string =>
  readFileSync(new URL(path, FIXTURES), "utf8");

export const rpc = (method: string, params?: unknown, id = 1): string =>
  JSON.stringify({ jsonrpc: "2.0", id, method, params });

export const postRequest = (
  body: string | ReadableStream<Uint8Array>,
  headers: Record<string, string> = {}
): Request =>
  new Request(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", accept: ACCEPT, ...headers },
    body,
    duplex: "half",
  } as RequestInit);

export type RpcReply = {
  readonly result?: {
    readonly tools?: ReadonlyArray<{ readonly name: string }>;
    readonly content?: ReadonlyArray<{ readonly text: string }>;
    readonly contents?: ReadonlyArray<{ readonly text: string }>;
    readonly isError?: boolean;
  };
  readonly error?: { readonly code: number; readonly message: string };
};

export const callTool = async (
  name: string,
  args: Record<string, unknown>,
  deps?: HandlerDeps
): Promise<{ response: Response; reply: RpcReply }> => {
  const request = postRequest(rpc("tools/call", { name, arguments: args }));
  const response = await handleRequest(request, deps);
  return { response, reply: (await response.json()) as RpcReply };
};

export const toolText = (reply: RpcReply): string =>
  reply.result?.content?.[0]?.text ?? "";

/** A three-step KRD structured workout. */
export const THREE_STEP_KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2025-01-15T10:00:00.000Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Remote smoke",
      sport: "cycling",
      steps: [0, 1, 2].map((stepIndex) => ({
        stepIndex,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "open",
        target: { type: "open" },
        intensity: stepIndex === 1 ? "active" : "warmup",
      })),
    },
  },
};
