import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Logger } from "@kaiord/core";

const mockLogin = vi.fn();

vi.mock("../utils/garmin-client-state", () => ({
  getGarminClient: vi.fn(() => ({
    auth: { login: mockLogin },
    service: {},
  })),
}));

import { registerGarminLoginTool } from "./kaiord-garmin-login";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

describe("kaiord_garmin_login", () => {
  let handler: ToolHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    const logger = createMockLogger();
    const mockServer = {
      tool: vi.fn(
        (_name: string, _desc: string, _schema: unknown, fn: ToolHandler) => {
          handler = fn;
        }
      ),
    };
    registerGarminLoginTool(mockServer as never, logger);
  });

  it("should return success on valid login", async () => {
    mockLogin.mockResolvedValue(undefined);

    const result = await handler({
      email: "user@test.com",
      password: "pass123",
    });

    expect(result.content[0].text).toContain("Logged in");
    expect(result.isError).toBeUndefined();
    expect(mockLogin).toHaveBeenCalledWith("user@test.com", "pass123");
  });

  it("should return error on login failure", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));

    const result = await handler({
      email: "user@test.com",
      password: "wrong",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid credentials");
  });
});
