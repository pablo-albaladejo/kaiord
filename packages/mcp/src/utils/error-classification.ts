/**
 * Machine-readable error vocabulary shared by every MCP tool response, so an
 * AI agent can branch on the *cause* of a failure rather than parsing prose.
 * Classification is by error class name / Node error code — never by message
 * substring — mirroring the CLI's failure-semantics vocabulary.
 */
export type McpErrorType =
  | "file-not-found"
  | "unsupported-format"
  | "validation"
  | "tolerance"
  | "auth"
  | "service"
  | "environment"
  | "unknown";

export type McpErrorClassification = {
  type: McpErrorType;
  suggestion?: string;
};

const NAME_TO_TYPE: Record<string, McpErrorType> = {
  FitParsingError: "validation",
  TcxParsingError: "validation",
  ZwiftParsingError: "validation",
  GarminParsingError: "validation",
  KrdValidationError: "validation",
  TcxValidationError: "validation",
  ZwiftValidationError: "validation",
  ToleranceExceededError: "tolerance",
  ServiceAuthError: "auth",
  ServiceApiError: "service",
  UnsupportedKrdTypeError: "unsupported-format",
  UnsupportedFormatError: "unsupported-format",
};

const CODE_TO_TYPE: Record<string, McpErrorType> = {
  ENOENT: "file-not-found",
  MODULE_NOT_FOUND: "environment",
  ERR_MODULE_NOT_FOUND: "environment",
};

const SUGGESTIONS: Partial<Record<McpErrorType, string>> = {
  "file-not-found": "Verify the file path exists and is readable.",
  "unsupported-format":
    "Use one of the supported formats: fit, gcn, krd, tcx, zwo.",
  auth: "Call kaiord_garmin_login first.",
  service: "The Garmin Connect request failed; retry later.",
  environment:
    "Reinstall @kaiord/mcp — a bundled schema or dependency is missing.",
};

const resolveType = (error: unknown): McpErrorType => {
  if (typeof error === "object" && error !== null) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && CODE_TO_TYPE[code]) {
      return CODE_TO_TYPE[code];
    }
    const name = (error as { name?: unknown }).name;
    if (typeof name === "string" && NAME_TO_TYPE[name]) {
      return NAME_TO_TYPE[name];
    }
  }
  return "unknown";
};

export const classifyError = (error: unknown): McpErrorClassification => {
  const type = resolveType(error);
  const suggestion = SUGGESTIONS[type];
  return suggestion ? { type, suggestion } : { type };
};
