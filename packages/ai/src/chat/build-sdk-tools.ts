import { tool as sdkTool } from "ai";
import type { ToolSet } from "ai";
import type { ChatTool } from "./chat-types";
import { wrapToolExecute } from "./wrap-tool-execute";

/**
 * Converts the injected {@link ChatTool} registry into the AI SDK tool map.
 *
 * Read tools get a schema-guarded `execute` so the SDK runs them inside the
 * multi-step loop. Action tools are registered WITHOUT `execute`, so the SDK
 * pauses the loop on the tool call and the engine can surface it for
 * confirmation instead of running a side effect unprompted.
 */
export const buildSdkTools = (tools: ChatTool[]): ToolSet => {
  const entries = tools.map((t) => {
    const base = { description: t.description, inputSchema: t.inputSchema };
    const built = t.requiresConfirmation
      ? sdkTool(base)
      : sdkTool({ ...base, execute: wrapToolExecute(t) });
    return [t.name, built] as const;
  });
  return Object.fromEntries(entries) as ToolSet;
};

/** Names of the tools that must be confirmed before execution. */
export const actionToolNames = (tools: ChatTool[]): Set<string> =>
  new Set(tools.filter((t) => t.requiresConfirmation).map((t) => t.name));
