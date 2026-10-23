import { describe, expect, it } from "vitest";

import { strayPlugins } from "./stray-plugins";

const builtin = (name: string) => ({
  name,
  path: "builtin",
  source: `${name}@builtin`,
});

describe("strayPlugins", () => {
  it("should accept the builtins the CLI loads under --safe-mode", () => {
    // Arrange
    const plugins = [
      builtin("cc-plugin-agents-md"),
      builtin("cc-plugin-telemetry"),
      builtin("cc-plugin-plugin-authoring"),
    ];

    // Act
    const stray = strayPlugins(plugins);

    // Assert
    expect(stray).toStrictEqual([]);
  });

  it("should name a builtin it has not been told about", () => {
    // Arrange
    const plugins = [builtin("cc-plugin-new-feature")];

    // Act
    const stray = strayPlugins(plugins);

    // Assert
    expect(stray).toStrictEqual(["cc-plugin-new-feature"]);
  });

  it("should name an installed plugin that reuses a builtin name", () => {
    // Arrange
    const plugins = [
      {
        name: "cc-plugin-telemetry",
        path: "/Users/x/.claude/plugins/cache/telemetry",
        source: "cc-plugin-telemetry@some-marketplace",
      },
    ];

    // Act
    const stray = strayPlugins(plugins);

    // Assert
    expect(stray).toStrictEqual(["cc-plugin-telemetry"]);
  });

  it("should count an entry it cannot read as stray", () => {
    // Arrange
    const plugins = ["oh-my-claudecode"];

    // Act
    const stray = strayPlugins(plugins);

    // Assert
    expect(stray).toStrictEqual(["<unrecognized plugin entry>"]);
  });
});
