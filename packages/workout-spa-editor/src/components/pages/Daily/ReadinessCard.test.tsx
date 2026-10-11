import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../test-utils";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { ReadinessCard } from "./ReadinessCard";
import type { ReadinessModel } from "./today-readiness";

const DAY = "2026-05-04";
const KNOWN_SCORE = 72;
const METRIC = { label: "HRV", value: "—" };

const model = (score: number | null): ReadinessModel => ({
  score,
  headline: "No readiness data yet",
  rationale: "",
  hrv: METRIC,
  sleep: { ...METRIC, label: "Sleep" },
  battery: { ...METRIC, label: "Battery" },
});

const renderCard = (score: number | null) => {
  const { hook } = memoryLocation({ path: "/daily", record: true });
  return renderWithProviders(
    <Router hook={hook}>
      <ReadinessCard readiness={model(score)} date={DAY} />
    </Router>,
    { persistence: createInMemoryPersistence() }
  );
};

describe("ReadinessCard", () => {
  it("should offer manual entry when there is no readiness data", async () => {
    // Arrange
    const user = userEvent.setup();
    renderCard(null);

    // Act
    await user.click(screen.getByTestId("readiness-log-manually"));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /Monday, May 4/i })
      ).toBeInTheDocument();
    });
  });

  it("should not push the manual entry once readiness is known", () => {
    // Arrange

    // Act
    renderCard(KNOWN_SCORE);

    // Assert
    expect(
      screen.queryByTestId("readiness-log-manually")
    ).not.toBeInTheDocument();
  });
});
