import { managedDataTypes } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { authorityInForce } from "../../data-source-policy/authority-in-force";
import type { ChatActionOps } from "./chat-tool-deps";
import { createSetAuthorityTool } from "./set-authority-tool";

const makeOps = (over: Partial<ChatActionOps> = {}): ChatActionOps => ({
  syncCoaching: vi.fn(),
  createWorkout: vi.fn(),
  logHealthMetric: vi.fn(),
  logIntake: vi.fn(),
  pushToGarmin: vi.fn(),
  setDataRoute: vi.fn(),
  setAuthority: over.setAuthority ?? vi.fn().mockResolvedValue({ ok: true }),
});

/** The kinds the description names after `label`, up to the next ";" or ". ". */
const listedAfter = (description: string, label: string): string[] => {
  const start = description.indexOf(label) + label.length;
  const rest = description.slice(start);
  const end = rest.search(/;|\. /);
  return rest
    .slice(0, end)
    .split(",")
    .map((kind) => kind.trim());
};

describe("createSetAuthorityTool", () => {
  it("should require confirmation", () => {
    // Arrange
    const tool = createSetAuthorityTool(makeOps());

    // Act
    const { name, requiresConfirmation } = tool;

    // Assert
    expect(name).toBe("set_authority");
    expect(requiresConfirmation).toBe(true);
  });

  it("should delegate a single-source priority order to the injected op", async () => {
    // Arrange
    const setAuthority = vi.fn().mockResolvedValue({ mode: "priority" });
    const tool = createSetAuthorityTool(makeOps({ setAuthority }));
    const input = {
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["whoop"],
    };

    // Act
    const result = await tool.execute(input);

    // Assert
    expect(setAuthority).toHaveBeenCalledWith(input);
    expect(result).toEqual({ mode: "priority" });
  });

  it("should reject a priority order that is empty or missing", () => {
    // Arrange
    const setAuthority = vi.fn();
    const tool = createSetAuthorityTool(makeOps({ setAuthority }));

    // Act
    const empty = () =>
      tool.execute({ dataType: "sleep", mode: "priority", sourceOrder: [] });
    const missing = tool.inputSchema.safeParse({
      dataType: "sleep",
      mode: "priority",
    });

    // Assert
    expect(empty).toThrow();
    expect(missing.success).toBe(false);
    expect(setAuthority).not.toHaveBeenCalled();
  });

  it("should reject an input with no mode", () => {
    // Arrange
    const tool = createSetAuthorityTool(makeOps());

    // Act
    const parsed = tool.inputSchema.safeParse({ dataType: "sleep" });

    // Assert
    expect(parsed.success).toBe(false);
  });

  it("should never tell the model that keeping every source is the default", () => {
    // Arrange
    const tool = createSetAuthorityTool(makeOps());

    // Act
    const description = tool.description;

    // Assert
    expect(description).not.toMatch(/\bthe default\b/i);
  });

  it("should name weight as decided by the App and activities as keeping every source when nothing is chosen", () => {
    // Arrange
    const tool = createSetAuthorityTool(makeOps());

    // Act
    const automatic = listedAfter(tool.description, "Platforms) for:");
    const union = listedAfter(tool.description, "keeps every source for:");

    // Assert
    expect(automatic).toContain("weight");
    expect(automatic).toContain("sleep");
    expect(union).toEqual(["workout", "planned-session", "activity"]);
  });

  it("should describe what decides every kind with nothing chosen exactly as the App reads it", () => {
    // Arrange
    const tool = createSetAuthorityTool(makeOps());
    const automatic = listedAfter(tool.description, "Platforms) for:");
    const union = listedAfter(tool.description, "keeps every source for:");

    // Act
    const mismatched = managedDataTypes.filter((dataType) => {
      const { mode } = authorityInForce(dataType, undefined);
      const inAutomatic = automatic.includes(dataType);
      const inUnion = union.includes(dataType);
      if (inAutomatic === inUnion) return true;
      return (inAutomatic ? "automatic" : "union") !== mode;
    });
    const unknown = [...automatic, ...union].filter(
      (kind) => !(managedDataTypes as readonly string[]).includes(kind)
    );

    // Assert
    expect(mismatched).toEqual([]);
    expect(unknown).toEqual([]);
  });
});
