import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { TrendsCard } from "./TrendsCard";

function renderCard() {
  const { hook } = memoryLocation({ path: "/calendar", record: true });
  return render(
    <Router hook={hook}>
      <TrendsCard />
    </Router>
  );
}

describe("TrendsCard", () => {
  it("should render a Trends card", () => {
    // Arrange
    renderCard();

    // Act
    const card = screen.getByTestId("today-trends-card");

    // Assert
    expect(card).toBeInTheDocument();
    expect(screen.getByText("Trends")).toBeInTheDocument();
  });

  it("should link to the health trends hub", () => {
    // Arrange
    renderCard();

    // Act
    const card = screen.getByTestId("today-trends-card");

    // Assert
    expect(card).toHaveAttribute("href", "/health");
  });
});
