/**
 * recordTurnUsage — the chat turn's dual-write during the usage-accounting
 * migration: `recordChatUsage` stays authoritative for the live `usage` row,
 * and the same counts are mirrored into the telemetry event log so the
 * fold-vs-legacy parity check can retire the legacy writer in a follow-up.
 * Centralized here so the cutover has a single call site to change.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderType } from "../../store/ai-store-types";
import { appendUsageEvent } from "../usage/append-usage-event";
import { recordChatUsage } from "./record-chat-usage";

type TurnUsage = { promptTokens: number; completionTokens: number };

export const recordTurnUsage = async (
  persistence: PersistencePort,
  providerType: LlmProviderType,
  usage: TurnUsage
): Promise<void> => {
  await recordChatUsage(persistence, { providerType, ...usage });
  try {
    await appendUsageEvent(persistence, {
      purpose: "chat",
      providerType,
      ...usage,
    });
  } catch {
    // Best-effort mirror: the event log is non-authoritative during the
    // migration, so a failed telemetry write must never fail a committed turn.
  }
};
