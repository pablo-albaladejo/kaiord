import { describe, expect, it } from "vitest";

import packageJson from "../../package.json";

/** Each published subpath and the source entry tsdown builds it from. */
const ENTRIES: Record<string, () => Promise<Record<string, unknown>>> = {
  ".": () => import("../index"),
  "./providers": () => import("../providers/index"),
  "./prompts": () => import("../prompts/index"),
  "./agents": () => import("./index"),
  "./observability": () => import("../observability/index"),
};

const INTERNAL = ["keepUnderlyingFailure", "underlyingFailureOf"];

describe("the underlying-failure accessor", () => {
  it("should cover every subpath the package publishes", () => {
    // Arrange
    const published = Object.keys(packageJson.exports).sort();

    // Act
    const covered = Object.keys(ENTRIES).sort();

    // Assert
    expect(covered).toEqual(published);
  });

  it("should not be exported from any published entry point", async () => {
    // Arrange
    const loaded = await Promise.all(
      Object.entries(ENTRIES).map(
        async ([path, load]) => [path, await load()] as const
      )
    );

    // Act
    const leaks = loaded.flatMap(([path, module]) =>
      INTERNAL.filter((name) => name in module).map((name) => `${path} ${name}`)
    );

    // Assert
    expect(leaks).toEqual([]);
  });
});
