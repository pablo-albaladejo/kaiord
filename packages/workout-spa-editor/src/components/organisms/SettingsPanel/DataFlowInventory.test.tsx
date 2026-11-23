import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { healthSharingStore } from "../../../lib/health-sharing-store";
import { DataFlowInventory } from "./DataFlowInventory";

const row = (id: string) => {
  const found = document.querySelector(`[data-destination="${id}"]`);
  if (!(found instanceof HTMLElement)) throw new Error(`no row ${id}`);
  return found;
};

describe("DataFlowInventory", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("should name every destination, each Platform and the analytics included", () => {
    // Arrange
    const active = () => false;

    // Act
    render(<DataFlowInventory active={active} />);

    // Assert
    for (const name of [
      "Anthropic",
      "OpenAI",
      "Google",
      "Garmin Connect",
      "TrainingPeaks",
      "Train2Go",
      "Tanita",
      "WHOOP",
      "intervals.icu",
      "Google Drive",
      "Umami",
    ]) {
      expect(screen.getByText(name, { exact: true })).toBeInTheDocument();
    }
    expect(row("umami")).toHaveTextContent(
      "On every page: page views and product events, never your data"
    );
  });

  it("should say what each flow sends and whether the destination is set up now", () => {
    // Arrange
    const active = (id: string) => id === "garmin";

    // Act
    render(<DataFlowInventory active={active} />);

    // Assert
    expect(within(row("garmin")).getByText("Active")).toBeInTheDocument();
    expect(row("garmin")).toHaveTextContent(
      "When you send a body-composition measurement to Garmin Connect: weight and body composition"
    );
    expect(within(row("openai")).getByText("Not set up")).toBeInTheDocument();
    expect(row("openai")).toHaveTextContent(
      "When you read a lab document with AI: lab results"
    );
  });

  it("should let the athlete change a Provider's standing health answer", async () => {
    // Arrange
    const user = userEvent.setup();
    healthSharingStore.set("anthropic", "never");
    render(<DataFlowInventory active={() => true} />);
    const select = screen.getByLabelText("Health data to Anthropic");

    // Act
    await user.selectOptions(select, "Always send");

    // Assert
    expect(healthSharingStore.read()).toEqual({ anthropic: "always" });
    expect(select).toHaveValue("always");
  });
});
