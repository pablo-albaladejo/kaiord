import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Logger } from "@kaiord/core";

const mockPush = vi.fn();
const mockIsAuthenticated = vi.fn();

vi.mock("../utils/garmin-client-state", () => ({
  getGarminClient: vi.fn(() => ({
    auth: { is_authenticated: mockIsAuthenticated },
    service: { push: mockPush },
  })),
}));

vi.mock("../utils/resolve-input", () => ({
  resolveTextInput: vi.fn(),
}));

vi.mock("@kaiord/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@kaiord/core")>();
  return {
    ...actual,
    validateKrd: vi.fn((data) => data),
  };
});

import { registerGarminPushTool } from "./kaiord-garmin-push";
import { resolveTextInput } from "../utils/resolve-input";

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

const mockPushResult = {
  id: "123",
  name: "Test Workout",
  url: "https://connect.garmin.com/modern/workout/123",
};

describe("kaiord_garmin_push", () => {
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
    registerGarminPushTool(mockServer as never, logger);
  });

  it("should push workout when authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    vi.mocked(resolveTextInput).mockResolvedValue('{"version":"1.0"}');
    mockPush.mockResolvedValue(mockPushResult);

    const result = await handler({ input_content: '{"version":"1.0"}' });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as unknown;
    expect(parsed).toEqual(mockPushResult);
  });

  it("should return error when not authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(false);

    const result = await handler({ input_content: '{"version":"1.0"}' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Not authenticated");
  });

  it("should return error on push failure", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    vi.mocked(resolveTextInput).mockResolvedValue('{"version":"1.0"}');
    mockPush.mockRejectedValue(new Error("Push failed"));

    const result = await handler({ input_content: '{"version":"1.0"}' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Push failed");
  });
});
