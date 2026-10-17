import { describe, expect, it, vi } from "vitest";

import en from "../../i18n/locales/en/chat.json";
import es from "../../i18n/locales/es/chat.json";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import {
  CHAT_CAPABILITIES,
  type ChatCapability,
  chatCapabilitySections,
} from "./chat-capabilities";
import { buildChatTools } from "./tools/build-chat-tools";

const tools = () =>
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
  });

const catalog: Record<string, ChatCapability> = CHAT_CAPABILITIES;

describe("CHAT_CAPABILITIES", () => {
  it("should have exactly one entry per registered chat tool", () => {
    // Arrange
    const registered = tools().map((t) => t.name);

    // Act
    const cataloged = Object.keys(catalog);

    // Assert
    expect(cataloged.sort()).toEqual(registered.sort());
  });

  it("should mark as writing exactly the tools that require confirmation", () => {
    // Arrange
    const registered = tools();

    // Act
    const mismatched = registered.filter(
      (t) => catalog[t.name]?.writes !== t.requiresConfirmation
    );

    // Assert
    expect(mismatched.map((t) => t.name)).toEqual([]);
  });

  it.each([
    ["en", en],
    ["es", es],
  ])("should have a %s label for every tool and example", (_, dict) => {
    // Arrange
    const { tool, example } = dict.capabilities as {
      tool: Record<string, string>;
      example: Record<string, string>;
    };

    // Act
    const missing = Object.entries(catalog).flatMap(([name, c]) => [
      ...(tool[name] ? [] : [`tool.${name}`]),
      ...c.examples.filter((id) => !example[id]).map((id) => `example.${id}`),
    ]);

    // Assert
    expect(missing).toEqual([]);
  });
});

describe("chatCapabilitySections", () => {
  it("should group tools as consult, log and do, flagging the writing groups", () => {
    // Arrange
    const order = ["consult", "log", "do"];

    // Act
    const sections = chatCapabilitySections();

    // Assert
    expect(sections.map((s) => s.group)).toEqual(order);
    expect(sections.map((s) => s.writes)).toEqual([false, true, true]);
    expect(sections[1].tools).toEqual(["log_health_metric", "log_intake"]);
    expect(sections[1].examples).toEqual(["logWeight", "logSleep", "logMeal"]);
  });
});
