/**
 * The clean context without `--bare` (which forbids the subscription login):
 * no settings sources, no MCP servers, no built-in tools, no slash commands,
 * no session written to disk. `stream-json` with `--verbose` is the output
 * that carries the `init` message and the `rate_limit_event`s the harness
 * checks; plain `json` carries only the result.
 */
export const CLEAN_CONTEXT_FLAGS = [
  "-p",
  "--safe-mode",
  "--setting-sources",
  "",
  "--strict-mcp-config",
  "--tools",
  "",
  "--disable-slash-commands",
  "--no-session-persistence",
  "--output-format",
  "stream-json",
  "--verbose",
] as const;

export type ClaudeRequest = {
  modelId: string;
  /** The production system prompt, passed whole. */
  system: string;
  /** The user content, sent on stdin. */
  prompt: string;
  /** Becomes `--json-schema`; absent for the calibration call. */
  jsonSchema?: unknown;
};

export const claudeArgs = (request: ClaudeRequest): Array<string> => [
  ...CLEAN_CONTEXT_FLAGS,
  "--model",
  request.modelId,
  "--system-prompt",
  request.system,
  ...(request.jsonSchema === undefined
    ? []
    : ["--json-schema", JSON.stringify(request.jsonSchema)]),
];
