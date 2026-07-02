import { ServiceApiError } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { SCORED_RECOVERY, SCORED_SLEEP } from "../../test-utils/fixtures";
import type { WhoopHttpClient } from "../http/types";
import { RECOVERY_PATH, SLEEP_PATH } from "../http/urls";
import { createWhoopHealthService } from "./whoop-health-service";

const routeClient = (routes: Record<string, unknown[]>): WhoopHttpClient => ({
  get: vi.fn(async (path: string) => {
    const key = Object.keys(routes).find((prefix) => path.startsWith(prefix));
    const pages = key ? routes[key]! : [];
    return (pages.shift() ?? { records: [], next_token: null })!;
  }),
});

const EXPECTED_RESTING_HR = 64;

describe("createWhoopHealthService", () => {
  it("should join recovery resting heart rate onto the matching sleep record", async () => {
    // Arrange
    const client = routeClient({
      [RECOVERY_PATH]: [{ records: [SCORED_RECOVERY], next_token: null }],
      [SLEEP_PATH]: [{ records: [SCORED_SLEEP], next_token: null }],
    });
    const service = createWhoopHealthService(client, {
      info: vi.fn(),
    } as never);

    // Act
    const result = await service.importAll();
    const sleep = result.sleep[0]?.extensions?.health?.sleep;

    // Assert
    expect(result.recovery).toHaveLength(1);
    expect(result.sleep).toHaveLength(1);
    expect(result.krds).toHaveLength(2);
    expect(sleep?.restingHeartRate).toBe(EXPECTED_RESTING_HR);
  });

  it("should follow next_token across pages", async () => {
    // Arrange
    const client = routeClient({
      [RECOVERY_PATH]: [
        { records: [SCORED_RECOVERY], next_token: "cursor-2" },
        { records: [SCORED_RECOVERY], next_token: null },
      ],
    });
    const service = createWhoopHealthService(client, {
      info: vi.fn(),
    } as never);

    // Act
    const recovery = await service.importRecovery();

    // Assert
    expect(recovery).toHaveLength(2);
    expect(client.get).toHaveBeenCalledTimes(2);
  });

  it("should wrap transport failures in a ServiceApiError", async () => {
    // Arrange
    const client: WhoopHttpClient = {
      get: vi.fn(async () => {
        throw new Error("429 rate limited");
      }),
    };
    const service = createWhoopHealthService(client, {
      info: vi.fn(),
    } as never);

    // Act
    const act = service.importRecovery();

    // Assert
    await expect(act).rejects.toBeInstanceOf(ServiceApiError);
  });
});
