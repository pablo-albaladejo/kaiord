export type RpcId = string | number | null;

const ERROR_INFO = "type.googleapis.com/google.rpc.ErrorInfo";
const DOMAIN = "a2a-protocol.org";

export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;

/** A2A-specific errors (spec §5.4), each with its ErrorInfo reason. */
export const A2A_ERRORS = {
  taskNotFound: { code: -32001, reason: "TASK_NOT_FOUND" },
  pushNotSupported: { code: -32003, reason: "PUSH_NOTIFICATION_NOT_SUPPORTED" },
  unsupported: { code: -32004, reason: "UNSUPPORTED_OPERATION" },
  versionNotSupported: { code: -32009, reason: "VERSION_NOT_SUPPORTED" },
} as const;

export type A2aError = (typeof A2A_ERRORS)[keyof typeof A2A_ERRORS];

const reply = (body: Record<string, unknown>): Response =>
  new Response(JSON.stringify({ jsonrpc: "2.0", ...body }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

export const rpcResult = (id: RpcId, result: unknown): Response =>
  reply({ id, result });

export const rpcError = (id: RpcId, code: number, message: string): Response =>
  reply({ id, error: { code, message } });

export const a2aError = (
  id: RpcId,
  error: A2aError,
  message: string,
  metadata?: Record<string, string>
): Response => {
  const info = { "@type": ERROR_INFO, reason: error.reason, domain: DOMAIN };
  const data = [metadata === undefined ? info : { ...info, metadata }];
  return reply({ id, error: { code: error.code, message, data } });
};

export const rpcIdOf = (value: unknown): RpcId =>
  typeof value === "string" || typeof value === "number" ? value : null;
