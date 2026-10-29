const KIB = 1024;
const MIB = KIB * KIB;

export const MCP_PATH = "/mcp";

/** D6: the largest request body the Worker reads, streamed, before parsing. */
export const MAX_BODY_BYTES = 64 * KIB;

/** D4: bounds the FIT encoder's buffer reservation inside a 128 MB isolate. */
export const FIT_OUTPUT_CAP_BYTES = 16 * MIB;

/** The tools the remote server registers; only these names are ever logged. */
export const REMOTE_TOOL_NAMES: ReadonlyArray<string> = [
  "kaiord_convert",
  "kaiord_diff",
  "kaiord_extract_workout",
  "kaiord_get_format_spec",
  "kaiord_inspect",
  "kaiord_list_formats",
  "kaiord_round_trip_validate",
  "kaiord_validate",
];
