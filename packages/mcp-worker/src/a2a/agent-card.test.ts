import { describe, expect, it } from "vitest";

import { dispatchMcp } from "../dispatch-mcp";
import { REMOTE_TOOL_NAMES } from "../limits";
import { buildAgentCard } from "./agent-card";
import { SKILL_IDS, SKILLS } from "./skills";

const SNAPSHOT = "../../../landing/public/.well-known/agent-card.json";
const JSON_INDENT = 2;

type ToolsList = {
  readonly result: { readonly tools: ReadonlyArray<{ name: string }> };
};

describe("agent card", () => {
  it("should match the committed snapshot file", async () => {
    // Arrange
    const card = buildAgentCard();

    // Act
    const text = `${JSON.stringify(card, null, JSON_INDENT)}\n`;

    // Assert
    await expect(text).toMatchFileSnapshot(SNAPSHOT);
  });

  it("should list skill ids equal to the live tools/list and the allowlist", async () => {
    // Arrange
    const message = { jsonrpc: "2.0", id: 1, method: "tools/list" };

    // Act
    const response = await dispatchMcp(message, {});
    const reply = (await response.json()) as ToolsList;

    // Assert
    const live = reply.result.tools.map((tool) => tool.name).sort();
    expect([...SKILL_IDS].sort()).toEqual(live);
    expect([...REMOTE_TOOL_NAMES].sort()).toEqual(live);
  });

  it("should change its version when a skill description changes", () => {
    // Arrange
    const [first, ...rest] = SKILLS;
    const edited = [{ ...first!, description: "changed" }, ...rest];

    // Act
    const before = buildAgentCard().version;
    const after = buildAgentCard(edited).version;

    // Assert
    expect(before).toMatch(/^1\.0\.0\+[0-9a-f]{12}$/);
    expect(after).toMatch(/^1\.0\.0\+[0-9a-f]{12}$/);
    expect(after).not.toBe(before);
  });

  it("should carry every 1.0 required field and declare no security", () => {
    // Arrange
    const required = [
      "name",
      "description",
      "version",
      "supportedInterfaces",
      "capabilities",
      "defaultInputModes",
      "defaultOutputModes",
      "skills",
    ];

    // Act
    const card = buildAgentCard();

    // Assert
    for (const key of required) expect(card).toHaveProperty(key);
    expect(card.supportedInterfaces).toEqual([
      {
        url: "https://kaiord.com/a2a",
        protocolBinding: "JSONRPC",
        protocolVersion: "1.0",
      },
    ]);
    expect(Object.values(card.capabilities as object)).toEqual([
      false,
      false,
      false,
    ]);
    expect(card).not.toHaveProperty("securitySchemes");
    expect(card).not.toHaveProperty("security");
    for (const skill of SKILLS) {
      expect(skill.tags.length).toBeGreaterThan(0);
      expect(skill.description).not.toBe("");
    }
  });
});
