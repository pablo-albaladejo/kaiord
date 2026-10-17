import type { LanguageModel, ModelMessage } from "ai";
import type { z } from "zod";
import type { Logger } from "@kaiord/core";
import type { AiTelemetrySink } from "../observability/telemetry-types";

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
      /**
       * Halted early: `aborted` by the caller's signal, `timeout` by the
       * per-turn watchdog. `text` is what streamed before the stop; `messages`
       * holds it as a plain assistant message (no half-finished tool call), so
       * the conversation stays resumable.
       */
      status: "step_limit" | "aborted" | "timeout";
      text: string;
      messages: ModelMessage[];
      usage?: ChatUsage;
    };

/** Per-call controls for one turn. */
export type ChatTurnOptions = {
  /** Aborting it stops the turn and resolves with status `aborted`. */
  signal?: AbortSignal;
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
  /**
   * Watchdog for one turn, in ms; resolves with status `timeout` when hit.
   * Defaults to `maxSteps` × {@link TURN_STEP_BUDGET_MS}.
   */
  turnTimeoutMs?: number;
  /** Receives one `chat_turn_finished` event per turn (ids + metrics only). */
  telemetry?: AiTelemetrySink;
  /** Version of `system`, stamped on telemetry. Defaults to `unknown`. */
  promptVersion?: string;
};

export type ChatAgent = {
  sendTurn: (
    messages: ModelMessage[],
    options?: ChatTurnOptions
  ) => Promise<ChatTurnResult>;
  resume: (
    messages: ModelMessage[],
    resolution: ToolResolution,
    options?: ChatTurnOptions
  ) => Promise<ChatTurnResult>;
};

export const DEFAULT_MAX_STEPS = 8;

/**
 * Wall-clock budget per tool step: one streamed model call (a few seconds to
 * first token, then the reply) plus a local Dexie-backed read tool. 15 s is
 * generous for a healthy provider, so the watchdog only fires on a stalled
 * stream, never on a merely long answer.
 */
export const TURN_STEP_BUDGET_MS = 15_000;

/** {@link DEFAULT_MAX_STEPS} steps at {@link TURN_STEP_BUDGET_MS}: 120 s. */
export const DEFAULT_TURN_TIMEOUT_MS = DEFAULT_MAX_STEPS * TURN_STEP_BUDGET_MS;
