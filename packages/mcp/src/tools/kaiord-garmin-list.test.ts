import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Logger } from "@kaiord/core";

const mockList = vi.fn();
const mockIsAuthenticated = vi.fn();

vi.mock("../utils/garmin-client-state", () => ({
  getGarminClient: vi.fn(() => ({
    auth: { is_authenticated: mockIsAuthenticated },
    service: { list: mockList },
  })),
}));

import { registerGarminListTool } from "./kaiord-garmin-list";

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

const mockWorkouts = [
  { id: "1", name: "Run", sport: "running", created_at: "", updated_at: "" },
];

describe("kaiord_garmin_list", () => {
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
    registerGarminListTool(mockServer as never, logger);
  });

  it("should list workouts when authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockList.mockResolvedValue(mockWorkouts);

    const result = await handler({});

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as unknown;
    expect(parsed).toEqual(mockWorkouts);
  });

  it("should return error when not authenticated", async () => {
    mockIsAuthenticated.mockReturnValue(false);

    const result = await handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Not authenticated");
  });

  it("should pass limit and offset options", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockList.mockResolvedValue([]);

    await handler({ limit: 5, offset: 10 });

    expect(mockList).toHaveBeenCalledWith({ limit: 5, offset: 10 });
  });

  it("should return error on service failure", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockList.mockRejectedValue(new Error("API error"));

    const result = await handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("API error");
  });
});
