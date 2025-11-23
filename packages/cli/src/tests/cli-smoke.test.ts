import { execa } from "execa";
import { dirname, join } from "path";
import stripAnsi from "strip-ansi";
import { fileURLToPath } from "url";
import { beforeAll, describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("CLI smoke tests", () => {
  beforeAll(async () => {
    // Build the CLI before running tests
    await execa("pnpm", ["build"], {
      cwd: join(__dirname, "../.."),
    });
  });

  it("should display help with --help flag", async () => {
    // Arrange & Act
    const { stdout } = await execa("./dist/bin/kaiord.js", ["--help"], {
      cwd: join(__dirname, "../.."),
    });
    const output = stripAnsi(stdout);

    // Assert
    expect(output).toContain("kaiord");
    expect(output).toContain("convert");
    expect(output).toContain("validate");
  });

  it("should display version with --version flag", async () => {
    // Arrange & Act
    const { stdout } = await execa("./dist/bin/kaiord.js", ["--version"], {
      cwd: join(__dirname, "../.."),
    });
    const output = stripAnsi(stdout);

    // Assert
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  it("should show error for invalid command", async () => {
    // Arrange & Act & Assert
    try {
      await execa("./dist/bin/kaiord.js", ["invalid-command"], {
        cwd: join(__dirname, "../.."),
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      const execaError = error as { stderr: string; exitCode: number };
      const output = stripAnsi(execaError.stderr);

      expect(output).toContain("Unknown argument");
      expect(execaError.exitCode).not.toBe(0);
    }
  });

  it("should show usage when convert command is missing required args", async () => {
    // Arrange & Act & Assert
    try {
      await execa("./dist/bin/kaiord.js", ["convert"], {
        cwd: join(__dirname, "../.."),
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      const execaError = error as { stderr: string; exitCode: number };
      const output = stripAnsi(execaError.stderr);

      expect(output).toContain("input");
      expect(execaError.exitCode).toBe(1);
    }
  });

  it("should display easter egg with --kiro flag", async () => {
    // Arrange & Act
    const { stdout } = await execa("./dist/bin/kaiord.js", ["--kiro"], {
      cwd: join(__dirname, "../.."),
    });
    const output = stripAnsi(stdout);

    // Assert
    expect(output).toContain("Kiroween");
    expect(output).toContain("Kiro");
    expect(output).toContain("kiroween.devpost.com");
  });

  it("should display easter egg with --kiroween flag", async () => {
    // Arrange & Act
    const { stdout } = await execa("./dist/bin/kaiord.js", ["--kiroween"], {
      cwd: join(__dirname, "../.."),
    });
    const output = stripAnsi(stdout);

    // Assert
    expect(output).toContain("Kiroween");
    expect(output).toContain("Kiro");
    expect(output).toContain("kiroween.devpost.com");
  });
});
