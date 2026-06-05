import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { renderWithProviders } from "../../../test-utils";
import CreateWorkout from "./CreateWorkout";

function renderCreate() {
  const { hook } = memoryLocation({ path: "/workout/new", record: true });
  return renderWithProviders(
    <Router hook={hook}>
      <CreateWorkout onClose={vi.fn()} onSaved={vi.fn()} />
    </Router>
  );
}

describe("CreateWorkout", () => {
  it("should render the eager route heading on the default surface", async () => {
    // Arrange

    // Act
    const { container } = renderCreate();

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("create-workout")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "New session", level: 1 })
    ).toBeInTheDocument();
    expect(container.querySelector("[data-route-heading]")).not.toBeNull();
  });
});
