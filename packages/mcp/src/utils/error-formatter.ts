export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export const formatSuccess = (text: string): ToolResult => ({
  content: [{ type: "text", text }],
});

export const formatError = (error: unknown): ToolResult => {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
};
