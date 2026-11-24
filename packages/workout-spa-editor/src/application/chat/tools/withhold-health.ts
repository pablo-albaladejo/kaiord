import type { ChatTool } from "@kaiord/ai";

import { HEALTH_READING_TOOLS } from "./health-reading-tools";

/** What a health tool answers when the athlete chose not to share. */
export const HEALTH_WITHHELD = {
  withheld: true,
  reason:
    "The athlete chose not to share their health data with this provider. " +
    "Answer without it, and say that you could not read it.",
} as const;

/**
 * With health not shared, each health-reading tool keeps its name, schema and
 * description (so the model still knows it exists) and reads nothing.
 */
export const withholdHealth = (
  tools: ChatTool[],
  shared: boolean
): ChatTool[] =>
  shared
    ? tools
    : tools.map((tool) =>
        HEALTH_READING_TOOLS.has(tool.name)
          ? { ...tool, execute: async () => HEALTH_WITHHELD }
          : tool
      );
