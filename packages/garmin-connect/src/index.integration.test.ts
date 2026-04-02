import { beforeAll, describe, it, expect } from "vitest";
import type { KRD } from "@kaiord/core";
import { createGarminConnectClient } from "./index";

const email = process.env.GARMIN_TEST_EMAIL;
const password = process.env.GARMIN_TEST_PASSWORD;

type Tokens = Awaited<
  ReturnType<
    ReturnType<typeof createGarminConnectClient>["auth"]["export_tokens"]
  >
>;
let sharedTokens: Tokens;

describe.skipIf(!email || !password)("Garmin Connect Integration", () => {
  beforeAll(async () => {
    const { auth } = createGarminConnectClient();
    await auth.login(email!, password!);
    sharedTokens = await auth.export_tokens();
  }, 30_000);

  it("should login and obtain valid tokens", () => {
    expect(sharedTokens).toBeDefined();
    expect(sharedTokens.oauth1).toBeDefined();
    expect(sharedTokens.oauth2).toBeDefined();
  });

  it("should export and restore tokens across clients", async () => {
    const client = createGarminConnectClient();
    await client.auth.restore_tokens(sharedTokens);

    expect(client.auth.is_authenticated()).toBe(true);
  });

  it("should list workouts", async () => {
    const { auth, service } = createGarminConnectClient();
    await auth.restore_tokens(sharedTokens);

    const workouts = await service.list({ limit: 5 });

    expect(Array.isArray(workouts)).toBe(true);
    for (const w of workouts) {
      expect(w).toHaveProperty("id");
      expect(w).toHaveProperty("name");
      expect(w).toHaveProperty("sport");
    }
  }, 30_000);

  it("should push a workout", async () => {
    const { auth, service } = createGarminConnectClient();
    await auth.restore_tokens(sharedTokens);

    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        structured_workout: {
          sport: "cycling",
          name: "Integration Test Workout",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "open",
              target: { type: "open" },
              intensity: "warmup",
            },
            {
              stepIndex: 1,
              durationType: "time",
              duration: { type: "time", seconds: 1200 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 200 },
              },
              intensity: "active",
            },
            {
              stepIndex: 2,
              durationType: "open",
              duration: { type: "open" },
              targetType: "open",
              target: { type: "open" },
              intensity: "cooldown",
            },
          ],
        },
      },
    };

    const result = await service.push(krd);

    expect(result.id).toBeDefined();
    expect(result.name).toBeDefined();
  }, 30_000);
});
