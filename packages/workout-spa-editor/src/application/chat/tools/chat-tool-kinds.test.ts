import { describe, expect, it } from "vitest";

import { DATA_FLOWS } from "../../data-flows/data-flows";
import { isHealthKind } from "../../data-flows/data-kinds";
import { buildChatTools } from "./build-chat-tools";
import {
  CHAT_TOOLS_WITH_KINDS,
  chatToolKinds,
  HEALTH_METRIC_KINDS,
} from "./chat-tool-kinds";
import { NUMERIC_FIELDS } from "./health-projection-fields";
import { HEALTH_READING_TOOLS } from "./health-reading-tools";
import { HEALTH_METRICS } from "./profile-readers";

/** Every field `summarizeHealth` may copy, and the kind it is. A field
 * added to NUMERIC_FIELDS without a kind here fails. */
const FIELD_KIND: Record<string, string> = {
  totalDurationSeconds: "sleep",
  score: "*",
  restingHeartRate: "restingHeartRate",
  weightKilograms: "weight",
  rMSSD: "hrv",
  steps: "dailyActivity",
  activeCalories: "dailyActivity",
  restingCalories: "dailyActivity",
  floorsClimbed: "dailyActivity",
  bodyFatPercent: "bodyComposition",
  leanMassKilograms: "bodyComposition",
  boneMassKilograms: "bodyComposition",
  bodyWaterPercent: "bodyComposition",
  bmi: "bodyComposition",
  visceralFatRating: "bodyComposition",
  basalMetabolicRateKcal: "bodyComposition",
  averageLevel: "stress",
  peakLevel: "stress",
};

const TOOLS = buildChatTools({
  persistence: {} as never,
  profileId: "p",
  today: "2026-11-23",
  actions: {} as never,
  getMatrixSignals: async () => ({}) as never,
  offersTool: () => true,
}).map((tool) => tool.name);

describe("chatToolKinds", () => {
  it("should say what every chat tool hands the model", () => {
    // Arrange
    const known = new Set(CHAT_TOOLS_WITH_KINDS);

    // Act
    const unknown = TOOLS.filter((name) => !known.has(name));
    const gone = CHAT_TOOLS_WITH_KINDS.filter((name) => !TOOLS.includes(name));

    // Assert
    expect(unknown).toEqual([]);
    expect(gone).toEqual([]);
  });

  it("should name only kinds the assistant flow declares", () => {
    // Arrange
    const declared: readonly string[] = DATA_FLOWS.assistant.kinds;
    const calls = [
      ...TOOLS.map((name) => chatToolKinds(name, {})),
      ...HEALTH_METRICS.map((metric) =>
        chatToolKinds("query_health", { metric })
      ),
    ];

    // Act
    const undeclared = calls.flat().filter((kind) => !declared.includes(kind));

    // Assert
    expect(undeclared).toEqual([]);
  });

  it("should give each metric the kind of every field its reader copies", () => {
    // Arrange
    const metrics = Object.keys(NUMERIC_FIELDS) as Array<
      keyof typeof NUMERIC_FIELDS
    >;

    // Act
    const missing = metrics.flatMap((metric) =>
      NUMERIC_FIELDS[metric]
        .filter((field) => {
          const kind = FIELD_KIND[field];
          if (kind === undefined) return true;
          return (
            kind !== "*" && !HEALTH_METRIC_KINDS[metric].includes(kind as never)
          );
        })
        .map((field) => `${metric}.${field}`)
    );

    // Assert
    expect(missing).toEqual([]);
  });

  it("should give a health kind to every health-reading tool, and none to the others", () => {
    // Arrange
    const sample = { metric: "sleep" };

    // Act
    const health = TOOLS.filter((name) =>
      chatToolKinds(name, sample).some(isHealthKind)
    );

    // Assert
    expect(health.sort()).toEqual([...HEALTH_READING_TOOLS].sort());
  });
});
