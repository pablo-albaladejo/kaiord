// WebMCP: exposes the landing's key actions to an in-browser AI agent.
// Feature-detected; a browser without the API gets no change at all.

import { commands } from "./install-widget";

type ToolResult = { content: Array<{ type: "text"; text: string }> };

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<ToolResult>;
};

type ModelContext = {
  registerTool: (tool: WebMcpTool) => Promise<void> | void;
};

const ORIGIN = "https://kaiord.com";

export const RESOURCES = {
  editor: `${ORIGIN}/app/`,
  docs: `${ORIGIN}/docs/`,
  mcpTools: `${ORIGIN}/docs/mcp/tools`,
  krdFormat: `${ORIGIN}/docs/formats/krd`,
  llmsTxt: `${ORIGIN}/llms.txt`,
  agentSkills: `${ORIGIN}/.well-known/agent-skills/index.json`,
  source: "https://github.com/pablo-albaladejo/kaiord",
};

const text = (value: string): ToolResult => ({
  content: [{ type: "text", text: value }],
});

export const createTools = (navigate: (url: string) => void): WebMcpTool[] => [
  {
    name: "get_install_command",
    description:
      "Return the shell command that installs the Kaiord TypeScript SDK (@kaiord/core) with the given package manager.",
    inputSchema: {
      type: "object",
      properties: {
        packageManager: { type: "string", enum: Object.keys(commands) },
      },
      required: ["packageManager"],
    },
    execute: async ({ packageManager }) =>
      text(commands[String(packageManager)] ?? commands.npm),
  },
  {
    name: "get_kaiord_resources",
    description:
      "Return the URLs of the Kaiord web app, documentation, MCP server tools, KRD format spec, agent skills and source code.",
    inputSchema: { type: "object", properties: {} },
    execute: async () => text(JSON.stringify(RESOURCES)),
  },
  {
    name: "open_kaiord_editor",
    description:
      "Open the Kaiord web app (training calendar, workout editor and AI assistant). It runs in the browser and needs no account.",
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      navigate(RESOURCES.editor);
      return text(`Opening ${RESOURCES.editor}`);
    },
  },
];

const findModelContext = (): ModelContext | undefined => {
  const doc = document as Document & { modelContext?: ModelContext };
  const nav = navigator as Navigator & { modelContext?: ModelContext };
  return doc.modelContext ?? nav.modelContext;
};

export function setupWebMcp(
  navigate: (url: string) => void = (url) => window.location.assign(url)
): void {
  const modelContext = findModelContext();
  if (!modelContext) return;
  for (const tool of createTools(navigate)) {
    try {
      void Promise.resolve(modelContext.registerTool(tool)).catch(() => {});
    } catch {
      /* a tool rejected by the browser must not break the page */
    }
  }
}
