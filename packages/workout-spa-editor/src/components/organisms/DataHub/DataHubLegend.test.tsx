import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataHubLegend } from "./DataHubLegend";

describe("DataHubLegend", () => {
  it("should explain every cell state exactly once", () => {
    // Arrange

    // Act
    render(<DataHubLegend />);

    // Assert
    expect(screen.getByText("Syncing — click to turn off")).toBeInTheDocument();
    expect(screen.getByText("Ready — click to turn on")).toBeInTheDocument();
    expect(
      screen.getByText("Connect this integration first")
    ).toBeInTheDocument();
    expect(screen.getByText("Not supported yet")).toBeInTheDocument();
  });
});
