import {
  classifyError,
  type McpErrorClassification,
} from "./error-classification";

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  /** Machine-readable failure classification for AI-agent branching. */
  structuredContent?: { error: McpErrorClassification };
};

export const formatSuccess = (text: string): ToolResult => ({
  content: [{ type: "text", text }],
});

export const formatError = (error: unknown): ToolResult => {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
    structuredContent: { error: classifyError(error) },
  };
};
