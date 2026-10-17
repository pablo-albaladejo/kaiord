import { describe, expect, it, vi } from "vitest";

import { buildChatTools } from "../../../application/chat/tools/build-chat-tools";
import enChat from "../../../i18n/locales/en/chat.json";
import esChat from "../../../i18n/locales/es/chat.json";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import {
  ACTION_TOOL_NAMES,
  EXTERNAL_ACTIONS,
  isActionToolName,
} from "./pending-action-summary";

const actionToolNames = () =>
  buildChatTools({
    persistence: createInMemoryPersistence(),
    profileId: "p1",
    today: "2026-10-17",
    actions: {
      syncCoaching: vi.fn(),
      createWorkout: vi.fn(),
      logHealthMetric: vi.fn(),
      logIntake: vi.fn(),
      pushToGarmin: vi.fn(),
      setDataRoute: vi.fn(),
    },
    getMatrixSignals: vi.fn(),
  })
    .filter((tool) => tool.requiresConfirmation)
    .map((tool) => tool.name);

describe("pending-action renderers", () => {
  it("should have a renderer for every confirmation-gated tool in the registry", () => {
    // Arrange
    const names = actionToolNames();

    // Act
    const missing = names.filter((name) => !isActionToolName(name));

    // Assert
    expect(missing).toEqual([]);
    expect([...ACTION_TOOL_NAMES].sort()).toEqual([...names].sort());
  });

  it.each([
    ["en", enChat],
    ["es", esChat],
  ])("should label every action and external notice in %s", (_locale, chat) => {
    // Arrange
    const actions: Record<string, string> = chat.action;
    const external: Record<string, string> = chat.external;

    // Act
    const unlabelled = ACTION_TOOL_NAMES.filter((name) => !actions[name]);
    const unwarned = [...EXTERNAL_ACTIONS].filter((name) => !external[name]);

    // Assert
    expect(unlabelled).toEqual([]);
    expect(unwarned).toEqual([]);
  });
});
