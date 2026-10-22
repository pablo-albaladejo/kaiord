import { describe, expect, it } from "vitest";

import { createSpawnDouble } from "../../test-utils/claude-cli-doubles";
import { runProcess } from "./run-process";

describe("runProcess", () => {
  it("should keep a UTF-8 character split across two stdout chunks", async () => {
    // Arrange
    const bytes = Buffer.from('{"text":"rodaje suave en Z2, después"}');
    const split = bytes.indexOf(Buffer.from("é")) + 1;
    const double = createSpawnDouble(() => ({
      chunks: [bytes.subarray(0, split), bytes.subarray(split)],
    }));

    // Act
    const result = await runProcess(double.spawn, "claude", [], {
      cwd: "/nowhere",
      env: {},
      input: "",
    });

    // Assert
    expect(result.stdout).toBe('{"text":"rodaje suave en Z2, después"}');
    expect(result.stdout).not.toContain("�");
  });
});
