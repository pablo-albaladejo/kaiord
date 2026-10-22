import { describe, expect, it } from "vitest";

import { createSpawnDouble } from "../../test-utils/claude-cli-doubles";
import {
  INERT_PREFIX,
  detectClaudeCli,
  inertMessage,
} from "./detect-claude-cli";

const LIVE_ENV = { EVAL_LIVE: "1", PATH: "/usr/bin", HOME: "/home/x" };

const status = (fields: Record<string, unknown>) => ({
  stdout: JSON.stringify({
    loggedIn: true,
    authMethod: "claude.ai",
    apiProvider: "firstParty",
    email: "someone@example.com",
    orgId: "org-123",
    orgName: "Someone's Organization",
    ...fields,
  }),
});

const detectWith = async (
  env: Record<string, string>,
  reply: Parameters<typeof createSpawnDouble>[0] = () => status({})
) => {
  const double = createSpawnDouble(reply);
  const detection = await detectClaudeCli({ env, spawn: double.spawn });
  return { detection, calls: double.calls };
};

const reasonOf = (detection: Awaited<ReturnType<typeof detectClaudeCli>>) =>
  detection.available ? "" : detection.reason;

describe("detectClaudeCli", () => {
  it("should be inert before any process when CI is set", async () => {
    // Arrange
    const env = { ...LIVE_ENV, CI: "true" };

    // Act
    const { detection, calls } = await detectWith(env);

    // Assert
    expect(calls).toHaveLength(0);
    expect(inertMessage(reasonOf(detection))).toMatch(
      new RegExp(`^${INERT_PREFIX}: CI is set`)
    );
  });

  it("should be inert before any process without the EVAL_LIVE opt-in", async () => {
    // Arrange
    const env = { PATH: "/usr/bin", EVAL_LIVE: "true" };

    // Act
    const { detection, calls } = await detectWith(env);

    // Assert
    expect(calls).toHaveLength(0);
    expect(reasonOf(detection)).toContain("EVAL_LIVE is not 1");
  });

  it("should run claude auth status with the allowlisted env from an empty cwd", async () => {
    // Arrange
    const env = { ...LIVE_ENV, ANTHROPIC_API_KEY: "sk-test" };

    // Act
    const { detection, calls } = await detectWith(env);

    // Assert
    expect(detection).toEqual({ available: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.command).toBe("claude");
    expect(calls[0]?.args).toEqual(["auth", "status", "--json"]);
    expect(calls[0]?.options.shell).toBe(false);
    expect(calls[0]?.options.env).not.toHaveProperty("ANTHROPIC_API_KEY");
    expect(calls[0]?.cwdEntries).toEqual([]);
  });

  it("should refuse an API-key login and name the auth method", async () => {
    // Arrange
    const reply = () => status({ authMethod: "api_key" });

    // Act
    const { detection } = await detectWith(LIVE_ENV, reply);

    // Assert
    expect(reasonOf(detection)).toBe(
      "auth method is api_key, not the claude.ai subscription"
    );
  });

  it("should refuse a logged-out CLI", async () => {
    // Arrange
    const reply = () => status({ loggedIn: false });

    // Act
    const { detection } = await detectWith(LIVE_ENV, reply);

    // Assert
    expect(reasonOf(detection)).toBe("the CLI is not logged in");
  });

  it("should refuse a provider other than first-party", async () => {
    // Arrange
    const reply = () => status({ apiProvider: "bedrock" });

    // Act
    const { detection } = await detectWith(LIVE_ENV, reply);

    // Assert
    expect(reasonOf(detection)).toBe(
      "API provider is bedrock, not first-party"
    );
  });

  it("should never echo an email or an organization", async () => {
    // Arrange
    const reply = () => status({ authMethod: "someone@example.com" });

    // Act
    const { detection } = await detectWith(LIVE_ENV, reply);

    // Assert
    expect(reasonOf(detection)).toContain("unrecognized");
    expect(JSON.stringify(detection)).not.toMatch(/example\.com|org-123/);
  });

  it("should report a binary missing from PATH", async () => {
    // Arrange
    const reply = () => ({
      error: Object.assign(new Error("spawn claude ENOENT"), {
        code: "ENOENT",
      }),
    });

    // Act
    const { detection } = await detectWith(LIVE_ENV, reply);

    // Assert
    expect(reasonOf(detection)).toBe("the claude binary is not on PATH");
  });

  it("should report output that is not JSON or not the known shape", async () => {
    // Arrange
    const notJson = () => ({ stdout: "Not logged in", code: 1 });
    const wrongShape = () => ({ stdout: JSON.stringify({ loggedIn: "yes" }) });

    // Act
    const first = await detectWith(LIVE_ENV, notJson);
    const second = await detectWith(LIVE_ENV, wrongShape);

    // Assert
    expect(reasonOf(first.detection)).toContain("printed no JSON (exit 1)");
    expect(reasonOf(second.detection)).toContain("unrecognized shape");
  });
});
