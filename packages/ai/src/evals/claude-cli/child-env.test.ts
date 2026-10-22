import { describe, expect, it } from "vitest";

import { CHILD_ENV_ALLOWLIST, buildChildEnv } from "./child-env";

describe("buildChildEnv", () => {
  it("should pass only the allowlist plus MAX_THINKING_TOKENS", () => {
    // Arrange
    const parent = {
      PATH: "/usr/bin",
      HOME: "/home/x",
      ANTHROPIC_API_KEY: "sk-test",
      ANTHROPIC_AUTH_TOKEN: "token",
      ANTHROPIC_BASE_URL: "https://proxy.example",
      CLAUDE_CONFIG_DIR: "/elsewhere",
      CI: "true",
    };

    // Act
    const env = buildChildEnv(parent);

    // Assert
    expect(env).toEqual({
      PATH: "/usr/bin",
      HOME: "/home/x",
      MAX_THINKING_TOKENS: "0",
    });
  });

  it("should name exactly the variables the CLI needs for its login", () => {
    // Arrange
    const expected = [
      "PATH",
      "HOME",
      "USER",
      "LOGNAME",
      "SHELL",
      "LANG",
      "TMPDIR",
    ];

    // Act
    const allowlist = [...CHILD_ENV_ALLOWLIST];

    // Assert
    expect(allowlist).toEqual(expected);
  });
});
