import type { LanguageModel, ModelMessage } from "ai";
import type { z } from "zod";
import type { Logger } from "@kaiord/core";

/**
 * Contract for a single chat tool injected into the engine.
 *
 * Read tools (`requiresConfirmation: false`) run automatically inside the
 * multi-step loop. Action tools (`requiresConfirmation: true`) are exposed
 * to the model WITHOUT engine-side execution: when called, the turn pauses
 * and the caller runs `execute` only after explicit user confirmation.
 */
export type ChatTool = {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  requiresConfirmation: boolean;
  execute: (input: unknown) => Promise<unknown>;
};

export type ChatUsage = {
  promptTokens: number;
  completionTokens: number;
};

/** An action tool call awaiting the user's approve/deny decision. */
export type PendingAction = {
  toolName: string;
  toolCallId: string;
  /** Input already validated against the tool's `inputSchema`. */
  input: unknown;
};

/** The caller's decision for a pending action, fed back on resume. */
export type ToolResolution =
  | {
      toolCallId: string;
      toolName: string;
      status: "approved";
      output: unknown;
    }
  | { toolCallId: string; toolName: string; status: "declined" };

/**
 * Outcome of one turn. `messages` is the full updated conversation in AI SDK
 * `ModelMessage` form (input history + this turn's response), ready to persist
 * or to pass straight back into `resume`.
 */
export type ChatTurnResult =
  | {
      status: "complete";
      text: string;
      messages: ModelMessage[];
      usage?: ChatUsage;
    }
  | {
      status: "pending_action";
      pendingAction: PendingAction;
      messages: ModelMessage[];
    }
  | {
      status: "step_limit";
      text: string;
      messages: ModelMessage[];
      usage?: ChatUsage;
    };

export type ChatAgentConfig = {
  model: LanguageModel;
  tools: ChatTool[];
  system?: string;
  /** Hard cap on tool steps per turn. Defaults to {@link DEFAULT_MAX_STEPS}. */
  maxSteps?: number;
  logger?: Logger;
  /** Invoked with each streamed text delta as the assistant response arrives. */
  onTextDelta?: (delta: string) => void;
};

export type ChatAgent = {
  sendTurn: (messages: ModelMessage[]) => Promise<ChatTurnResult>;
  resume: (
    messages: ModelMessage[],
    resolution: ToolResolution
  ) => Promise<ChatTurnResult>;
};

export const DEFAULT_MAX_STEPS = 8;
