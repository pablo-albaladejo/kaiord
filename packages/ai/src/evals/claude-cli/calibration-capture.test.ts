import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  createSpawnDouble,
  initMessage,
  rateLimitEvent,
  resultMessage,
  streamOf,
} from "../../test-utils/claude-cli-doubles";
import {
  calibrationCaptureSchema,
  captureCalibration,
  project,
  writeCalibration,
} from "./calibration-capture";
import { createLiveSession } from "./live-session";
import { createSpawnClaude } from "./spawn-claude";

const OVERHEAD = 670;
const STAMP = 7;

const LEAKY_INFO = {
  status: "allowed_warning",
  resetsAt: 1761300000,
  rateLimitType: "seven_day",
  utilization: 0.75,
  isUsingOverage: false,
  userEmail: "someone@example.com",
  organizationUuid: "6f1c0000-0000-0000-0000-000000000000",
  note: "Free text with spaces, which is never kept",
  unifiedWindows: { seven_day: { utilization: 0.75, session_id: "x" } },
};

const capture = async () => {
  const stdout = streamOf(
    initMessage(),
    rateLimitEvent(LEAKY_INFO),
    resultMessage({
      modelUsage: {
        "claude-sonnet-5-20261001": {
          inputTokens: 3,
          costUSD: 0.01,
          label: "x",
        },
      },
    })
  );
  const double = createSpawnDouble(() => ({ stdout }));
  const session = createLiveSession({
    spawnClaude: createSpawnClaude({ env: {}, spawn: double.spawn }),
    maxCalls: 1,
    maxWeekly: 0.85,
    field: null,
  });
  return {
    result: await captureCalibration(session, "claude-sonnet-5"),
    double,
    session,
  };
};

describe("captureCalibration", () => {
  it("should capture one call even though the unpinned guard then stops the pass", async () => {
    // Arrange
    const expectedCalls = 1;

    // Act
    const { result, double, session } = await capture();

    // Assert
    expect(double.calls).toHaveLength(expectedCalls);
    expect(session.stopped()?.kind).toBe("harness-fault");
    expect(result.inputTokens).toBe(OVERHEAD);
    expect(result.modelUsage).toEqual({
      "claude-sonnet-5-20261001": { inputTokens: 3, costUSD: 0.01 },
    });
  });

  it("should keep the window fields and drop every email, org, uuid, session id and cwd", async () => {
    // Arrange
    const forbidden =
      /example\.com|6f1c0000|session|cwd|uuid|Free text|someone/;

    // Act
    const { result } = await capture();

    // Assert
    expect(result.rateLimitInfos).toEqual([
      {
        status: "allowed_warning",
        resetsAt: 1761300000,
        rateLimitType: "seven_day",
        utilization: 0.75,
        isUsingOverage: false,
        unifiedWindows: { seven_day: { utilization: 0.75 } },
      },
    ]);
    expect(JSON.stringify(result)).not.toMatch(forbidden);
  });

  it("should reject a capture carrying a key the allowlist does not name", async () => {
    // Arrange
    const { result } = await capture();

    // Act
    const parsed = calibrationCaptureSchema.safeParse({
      ...result,
      cwd: "/Users/x",
    });

    // Assert
    expect(parsed.success).toBe(false);
  });

  it("should write the capture to the given directory", async () => {
    // Arrange
    const { result } = await capture();
    const dir = mkdtempSync(join(tmpdir(), "calibration-"));

    // Act
    const path = writeCalibration(result, dir, () => STAMP);

    // Assert
    expect(path).toBe(join(dir, "calibration-7.json"));
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(result);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("project", () => {
  it("should stop at a fixed depth and drop arrays", () => {
    // Arrange
    const deep = { a: { b: { c: { d: { e: 1 } } } }, list: [1, 2] };

    // Act
    const projected = project(deep);

    // Assert
    expect(projected).toEqual({ a: { b: { c: {} } } });
  });
});
