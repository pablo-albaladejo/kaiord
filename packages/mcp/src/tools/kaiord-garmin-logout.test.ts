import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Logger } from "@kaiord/core";

const mockLogout = vi.fn();
const mockResetGarminClient = vi.fn();

vi.mock("../utils/garmin-client-state", () => ({
  getGarminClient: vi.fn(() => ({
    auth: { logout: mockLogout },
    service: {},
  })),
  resetGarminClient: (...args: unknown[]) => mockResetGarminClient(...args),
}));

import { registerGarminLogoutTool } from "./kaiord-garmin-logout";

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

describe("kaiord_garmin_logout", () => {
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
    registerGarminLogoutTool(mockServer as never, logger);
  });

  it("should return success after logout", async () => {
    mockLogout.mockResolvedValue(undefined);

    const result = await handler({});

    expect(result.content[0].text).toContain("Logged out");
    expect(result.isError).toBeUndefined();
    expect(mockLogout).toHaveBeenCalled();
    expect(mockResetGarminClient).toHaveBeenCalled();
  });

  it("should return error on logout failure", async () => {
    mockLogout.mockRejectedValue(new Error("Logout failed"));

    const result = await handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Logout failed");
  });
});
