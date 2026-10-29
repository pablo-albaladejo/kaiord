import { REMOTE_TOOL_NAMES } from "./limits";

/**
 * D8: a log line carries an event, the JSON-RPC method, the tool name and an
 * error class, never arguments, results or bodies. Method and tool come from
 * the caller, so each is written only when it is a known, content-free label.
 */
export type LogEntry = {
  readonly event: "tool_error" | "rpc_error" | "request_error";
  readonly method: string;
  readonly tool?: string;
  readonly errorClass: string;
};

export type Log = (entry: LogEntry) => void;

const LABEL = /^[A-Za-z][\w/-]{0,63}$/;
const UNKNOWN = "unknown";

const MCP_METHODS: ReadonlySet<string> = new Set([
  "initialize",
  "ping",
  "tools/list",
  "tools/call",
  "resources/list",
  "resources/read",
  "resources/templates/list",
  "prompts/list",
  "prompts/get",
  "completion/complete",
  "logging/setLevel",
  "notifications/initialized",
  "notifications/cancelled",
]);

/** For server-generated labels: an error name or classification type. */
export const safeLabel = (value: unknown): string =>
  typeof value === "string" && LABEL.test(value) ? value : UNKNOWN;

export const safeMethod = (value: unknown): string =>
  typeof value === "string" && MCP_METHODS.has(value) ? value : UNKNOWN;

export const safeToolName = (value: unknown): string =>
  typeof value === "string" && REMOTE_TOOL_NAMES.includes(value)
    ? value
    : UNKNOWN;

export const errorClassOf = (error: unknown): string =>
  error instanceof Error ? safeLabel(error.name) : UNKNOWN;

export const writeLog: Log = (entry) => {
  console.error(JSON.stringify(entry));
};
