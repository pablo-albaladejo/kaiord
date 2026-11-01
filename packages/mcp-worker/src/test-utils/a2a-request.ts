import type { HandlerDeps } from "../deps";
import { handleRequest } from "../handler";

export const A2A_ENDPOINT = "https://kaiord.com/a2a";

export type A2aReply = {
  readonly result?: {
    readonly task?: {
      readonly id: string;
      readonly contextId: string;
      readonly status: {
        readonly state: string;
        readonly message: {
          readonly role: string;
          readonly taskId: string;
          readonly parts: ReadonlyArray<{ readonly text: string }>;
        };
        readonly timestamp: string;
      };
      readonly artifacts?: ReadonlyArray<{
        readonly artifactId: string;
        readonly name: string;
        readonly parts: ReadonlyArray<{
          readonly text: string;
          readonly mediaType: string;
        }>;
      }>;
      readonly history?: ReadonlyArray<Record<string, unknown>>;
    };
    readonly tasks?: ReadonlyArray<unknown>;
    readonly totalSize?: number;
  };
  readonly error?: {
    readonly code: number;
    readonly message: string;
    readonly data?: ReadonlyArray<Record<string, unknown>>;
  };
};

type PostOptions = {
  readonly headers?: Record<string, string>;
  readonly url?: string;
  readonly deps?: HandlerDeps;
  readonly omitVersion?: boolean;
};

export const a2aBody = (method: string, params?: unknown): string =>
  JSON.stringify({ jsonrpc: "2.0", id: "r1", method, params });

export const userMessage = (
  parts: ReadonlyArray<unknown>,
  extra: Record<string, unknown> = {}
) => ({ message: { messageId: "m1", role: "ROLE_USER", parts, ...extra } });

export const skillMessage = (
  skill: string,
  args: Record<string, unknown> = {},
  extra: Record<string, unknown> = {}
) => userMessage([{ data: { skill, ...args } }], extra);

export const postA2a = async (
  body: string,
  options: PostOptions = {}
): Promise<{ response: Response; reply: A2aReply }> => {
  const request = new Request(options.url ?? A2A_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(options.omitVersion === true ? {} : { "a2a-version": "1.0" }),
      ...options.headers,
    },
    body,
  });
  const response = await handleRequest(request, options.deps);
  return { response, reply: (await response.json()) as A2aReply };
};

export const sendSkill = (
  skill: string,
  args: Record<string, unknown> = {},
  options: PostOptions = {}
) => postA2a(a2aBody("SendMessage", skillMessage(skill, args)), options);
