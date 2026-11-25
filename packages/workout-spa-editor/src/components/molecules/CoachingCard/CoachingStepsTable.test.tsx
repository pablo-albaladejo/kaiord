/* eslint-disable no-magic-numbers -- a steps table is literal durations, watts and bpm, clearer inline */
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { loadLocaleNamespaces } from "../../../i18n/resources";
import type { CoachingStepGroup } from "../../../types/coaching-structured-steps";
import { CoachingStepsTable } from "./CoachingStepsTable";

const active = vi.hoisted(() => ({ locale: "en" }));
vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => active.locale,
}));

// Synthetic table: invented zones, not an athlete's.
const row = (
  durationSeconds: number,
  zone: string,
  watts: [number, number],
  bpm: [number, number]
) => ({
  durationSeconds,
  zone,
  powerWatts: { min: watts[0], max: watts[1] },
  heartRateBpm: { min: bpm[0], max: bpm[1] },
});

const TABLE: CoachingStepGroup[] = [
  { repeat: 1, steps: [row(900, "R0", [0, 120], [60, 120])] },
  {
    repeat: 5,
    steps: [
      row(60, "R1", [121, 150], [121, 130]),
      row(60, "R0", [0, 120], [60, 120]),
    ],
  },
  { repeat: 1, steps: [row(30, "R1", [121, 150], [121, 130])] },
  { repeat: 1, steps: [row(210, "R1+", [151, 180], [131, 140])] },
];

const rowsText = () =>
  within(screen.getByTestId("coaching-dialog-steps"))
    .getAllByRole("row")
    .map((r) => r.textContent);

beforeAll(async () => {
  await loadLocaleNamespaces("es");
});

afterEach(() => {
  active.locale = "en";
});

describe("CoachingStepsTable", () => {
  it("should show each step as the coach wrote it, with repeat blocks as N × groups", () => {
    // Arrange
    const steps = TABLE;

    // Act
    render(<CoachingStepsTable steps={steps} />);

    // Assert
    expect(screen.getByText("Coach's steps")).toBeInTheDocument();
    expect(rowsText()).toStrictEqual([
      "DurationZonePowerHeart rate",
      "15 minR00–120 W60–120 bpm",
      "5 ×",
      "1 minR1121–150 W121–130 bpm",
      "1 minR00–120 W60–120 bpm",
      "30 sR1121–150 W121–130 bpm",
      "3:30 minR1+151–180 W131–140 bpm",
    ]);
  });

  it("should use the Spanish copy in Spanish", () => {
    // Arrange
    active.locale = "es";

    // Act
    render(<CoachingStepsTable steps={TABLE} />);

    // Assert
    expect(screen.getByText("Pasos del entrenador")).toBeInTheDocument();
    expect(rowsText()[0]).toBe("DuraciónZonaPotenciaFrecuencia cardiaca");
    expect(rowsText()[1]).toBe("15 minR00–120 W60–120 ppm");
  });

  it("should show nothing when there is no table", () => {
    // Arrange
    const steps = undefined;

    // Act
    const { container } = render(<CoachingStepsTable steps={steps} />);

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it("should show nothing rather than a table it cannot hold whole", () => {
    // Arrange
    const broken = [
      { repeat: 1, steps: [row(60, "R1", [150, 120], [60, 120])] },
    ];

    // Act
    const { container } = render(<CoachingStepsTable steps={broken} />);

    // Assert
    expect(container).toBeEmptyDOMElement();
  });
});
