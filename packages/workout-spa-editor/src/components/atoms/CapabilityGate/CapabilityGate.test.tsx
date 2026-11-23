import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CapabilitiesFixture } from "../../../contexts/capabilities-context";
import { CapabilityGate } from "./CapabilityGate";

const renderWith = (on: readonly string[]) =>
  render(
    <CapabilitiesFixture on={on}>
      <CapabilityGate id="templates">
        <button type="button">Keep</button>
      </CapabilityGate>
    </CapabilitiesFixture>
  );

describe("CapabilityGate", () => {
  it("should render nothing while the Capability is off", () => {
    // Arrange
    renderWith([]);

    // Act
    const button = screen.queryByRole("button", { name: "Keep" });

    // Assert
    expect(button).toBeNull();
  });

  it("should render its surface once the Capability is on", () => {
    // Arrange
    renderWith(["templates"]);

    // Act
    const button = screen.getByRole("button", { name: "Keep" });

    // Assert
    expect(button).toBeInTheDocument();
  });
});
