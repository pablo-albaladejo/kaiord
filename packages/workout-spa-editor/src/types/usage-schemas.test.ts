import { describe, expect, it } from "vitest";

import { usageEntrySchema, usageRecordSchema } from "./usage-schemas";

describe("usageEntrySchema", () => {
  it("requires inputTokens and outputTokens", () => {
    const entry = {
      date: "2026-04-20",
      inputTokens: 80,
      outputTokens: 20,
      tokens: 100,
      cost: 0.001,
    };

    expect(usageEntrySchema.parse(entry)).toEqual(entry);
  });

  it("rejects entries missing inputTokens", () => {
    expect(() =>
      usageEntrySchema.parse({
        date: "2026-04-20",
        outputTokens: 20,
        tokens: 100,
        cost: 0.001,
      })
    ).toThrow();
  });

  it("enforces tokens === inputTokens + outputTokens", () => {
    expect(() =>
      usageEntrySchema.parse({
        date: "2026-04-20",
        inputTokens: 10,
        outputTokens: 20,
        tokens: 999,
        cost: 0.001,
      })
    ).toThrow(/tokens/);
  });
});

describe("usageRecordSchema", () => {
  it("requires inputTokens, outputTokens, totalTokens, totalCost", () => {
    const record = {
      yearMonth: "2026-04",
      inputTokens: 120,
      outputTokens: 30,
      totalTokens: 150,
      totalCost: 0.02,
      entries: [
        {
          date: "2026-04-20",
          inputTokens: 120,
          outputTokens: 30,
          tokens: 150,
          cost: 0.02,
        },
      ],
    };

    expect(usageRecordSchema.parse(record)).toMatchObject({
      inputTokens: 120,
      outputTokens: 30,
      totalTokens: 150,
    });
  });

  it("enforces totalTokens === inputTokens + outputTokens", () => {
    expect(() =>
      usageRecordSchema.parse({
        yearMonth: "2026-04",
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 999,
        totalCost: 0.02,
        entries: [],
      })
    ).toThrow(/totalTokens/);
  });

  it("accepts `legacy: true` on migrated rows", () => {
    const record = {
      yearMonth: "2026-03",
      inputTokens: 200,
      outputTokens: 0,
      totalTokens: 200,
      totalCost: 0.01,
      entries: [],
      legacy: true,
    };

    const parsed = usageRecordSchema.parse(record);
    expect(parsed.legacy).toBe(true);
  });

  it("treats `legacy` as optional and absent by default", () => {
    const record = {
      yearMonth: "2026-04",
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      totalCost: 0.02,
      entries: [],
    };

    const parsed = usageRecordSchema.parse(record);
    expect(parsed.legacy).toBeUndefined();
  });
});
