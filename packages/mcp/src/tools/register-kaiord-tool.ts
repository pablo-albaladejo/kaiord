import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { ToolResult } from "../utils/error-formatter";

export const PATH_PARAMS: ReadonlyArray<string> = [
  "input_file",
  "output_file",
  "file1",
  "file2",
];

type KaiordTool<Shape extends z.ZodRawShape> = {
  readonly name: string;
  readonly description: string;
  readonly shape: Shape;
  readonly remote: boolean;
};

const omitPathParams = (shape: z.ZodRawShape): z.ZodRawShape =>
  Object.fromEntries(
    Object.entries(shape).filter(([key]) => !PATH_PARAMS.includes(key))
  );

const describeUnknownKeys = (issue: {
  code?: string;
  keys?: ReadonlyArray<string>;
}): string | undefined =>
  issue.code === "unrecognized_keys"
    ? `Parameter not accepted by the remote endpoint: ${issue.keys?.join(", ")}. Send inline content instead.`
    : undefined;

// The SDK strips unknown keys before a handler runs, so a remote call that
// sent a path next to valid content would succeed silently. A strict object
// rejects the call while the raw arguments are still visible.
const remoteSchema = (shape: z.ZodRawShape) =>
  z.strictObject(omitPathParams(shape), { error: describeUnknownKeys });

export const registerKaiordTool = <Shape extends z.ZodRawShape>(
  server: McpServer,
  tool: KaiordTool<Shape>,
  handler: (args: z.infer<z.ZodObject<Shape>>) => Promise<ToolResult>
): void => {
  const inputSchema = tool.remote ? remoteSchema(tool.shape) : tool.shape;
  server.registerTool(
    tool.name,
    { description: tool.description, inputSchema },
    handler as Parameters<McpServer["registerTool"]>[2]
  );
};
