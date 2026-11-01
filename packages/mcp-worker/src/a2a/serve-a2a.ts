import type { HandlerDeps } from "../deps";
import type { JsonRpcMessage } from "../parse-message";
import type { A2aError, RpcId } from "./json-rpc";
import {
  A2A_ERRORS,
  a2aError,
  INVALID_REQUEST,
  METHOD_NOT_FOUND,
  rpcError,
  rpcIdOf,
  rpcResult,
} from "./json-rpc";
import { sendMessage } from "./send-message";

const SUPPORTED_VERSION = "1.0";
const VERSION_PARAM = "A2A-Version";
const DEFAULT_PAGE_SIZE = 50;
const NOT_RETAINED = "Task not found: tasks are not retained";

type Refusal = readonly [A2aError, string];

const NO_STREAMING: Refusal = [
  A2A_ERRORS.unsupported,
  "Streaming is not supported",
];
const NO_PUSH: Refusal = [
  A2A_ERRORS.pushNotSupported,
  "Push notifications are not supported",
];

const REFUSED: Readonly<Record<string, Refusal>> = {
  GetTask: [A2A_ERRORS.taskNotFound, NOT_RETAINED],
  CancelTask: [A2A_ERRORS.taskNotFound, NOT_RETAINED],
  SendStreamingMessage: NO_STREAMING,
  SubscribeToTask: NO_STREAMING,
  GetExtendedAgentCard: [A2A_ERRORS.unsupported, "No extended agent card"],
  CreateTaskPushNotificationConfig: NO_PUSH,
  GetTaskPushNotificationConfig: NO_PUSH,
  ListTaskPushNotificationConfigs: NO_PUSH,
  DeleteTaskPushNotificationConfig: NO_PUSH,
};

/** Spec §3.6: an absent or empty version means 0.3, which is not served. */
const versionOf = (request: Request): string =>
  request.headers.get(VERSION_PARAM) ??
  new URL(request.url).searchParams.get(VERSION_PARAM) ??
  "";

const paramsOf = (message: JsonRpcMessage): Record<string, unknown> => {
  const { params } = message;
  return typeof params === "object" && params !== null
    ? (params as Record<string, unknown>)
    : {};
};

const listTasks = (id: RpcId, params: Record<string, unknown>): Response => {
  const size = params.pageSize;
  const pageSize = Number.isInteger(size) ? size : DEFAULT_PAGE_SIZE;
  return rpcResult(id, {
    tasks: [],
    nextPageToken: "",
    pageSize,
    totalSize: 0,
  });
};

export const serveA2a = async (
  request: Request,
  message: JsonRpcMessage,
  deps: HandlerDeps
): Promise<Response> => {
  const id = rpcIdOf(message.id);
  const { method } = message;
  if (message.jsonrpc !== "2.0" || typeof method !== "string") {
    return rpcError(id, INVALID_REQUEST, "Request payload validation error");
  }
  if (versionOf(request) !== SUPPORTED_VERSION) {
    const text = "A2A version not supported: send A2A-Version: 1.0";
    const metadata = { supported: SUPPORTED_VERSION };
    return a2aError(id, A2A_ERRORS.versionNotSupported, text, metadata);
  }
  if (method === "SendMessage") return sendMessage(id, paramsOf(message), deps);
  if (method === "ListTasks") return listTasks(id, paramsOf(message));
  const refused = Object.hasOwn(REFUSED, method) ? REFUSED[method] : undefined;
  if (refused !== undefined) return a2aError(id, refused[0], refused[1]);
  return rpcError(id, METHOD_NOT_FOUND, "Method not found");
};
