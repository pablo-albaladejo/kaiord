import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cliRun } from "../../test-utils/claude-cli-doubles";
import {
  buildCassette,
  simpleWorkout,
} from "../../test-utils/cassette-builder";
import { createParserReplaySuite } from "../cassettes/parser-replay-suite";
import { writeCassette } from "./cassette-writer";
import type { CassetteTargets } from "./cassette-writer";
import { createClaudeCliLanguageModel } from "./claude-cli-language-model";
import { runLiveMain } from "./live-main";
import { createLiveSession } from "./live-session";

// The official constant is pinned here; the targets below leave it unpinned.
vi.mock("../cassettes/validate-cassette", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  OFFICIAL_SERVED_FORM: "dated",
}));

const MODEL = "claude-sonnet-5";
let root: string;
let targets: CassetteTargets;

describe("an unpinned served form in the targets", () => {
  beforeEach(() => {
    vi.stubGlobal("AI_SDK_LOG_WARNINGS", false);
    root = mkdtempSync(join(tmpdir(), "served-form-"));
    targets = {
      committedDir: join(root, "c"),
      iterationDir: join(root, "i"),
      servedForm: null,
    };
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    rmSync(root, { recursive: true, force: true });
  });

  it("should refuse --record before any call even when the constant is pinned", async () => {
    // Arrange
    let calls = 0;
    const session = createLiveSession({
      spawnClaude: async () => {
        calls++;
        return cliRun({}, [{ status: "allowed", utilization: 0.1 }]);
      },
      maxCalls: 2,
      maxWeekly: 0.85,
      field: { path: ["utilization"], scale: "fraction" },
    });
    const model = createClaudeCliLanguageModel({
      modelId: MODEL,
      call: session.call,
    });
    const errors: Array<string> = [];

    // Act
    const outcome = await runLiveMain({
      argv: ["--record"],
      load: async () => ({
        model,
        modelId: MODEL,
        provider: "anthropic",
        session,
        managedSettings: [],
      }),
      log: () => undefined,
      error: (line) => errors.push(line),
      reportDir: join(root, "reports"),
      calibrationDir: join(root, "calibration"),
      targets,
    });

    // Assert
    expect(outcome).toBe("refused");
    expect(errors.join("\n")).toContain("OFFICIAL_SERVED_FORM is not pinned");
    expect(calls).toBe(0);
  });

  it("should refuse the committed write from the same targets", async () => {
    // Arrange
    const { cassette } = await buildCassette(
      createParserReplaySuite(MODEL),
      "cycling-simple",
      simpleWorkout("cycling")
    );

    // Act
    const write = () => writeCassette(cassette, targets);

    // Assert
    expect(write).toThrow("OFFICIAL_SERVED_FORM is not pinned");
  });
});
