import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ConnectionConfig } from "./connection-config";
import { NotSupportedRow } from "./NotSupportedRow";

const strava: ConnectionConfig = {
  id: "strava",
  name: "Strava",
  mark: "S",
  bridgeId: null,
  mechanism: "not-supported",
  flows: [],
};

describe("NotSupportedRow", () => {
  it("should render the honest not-supported state", () => {
    // Arrange

    // Act
    render(<NotSupportedRow config={strava} />);

    // Assert
    expect(screen.getByText("Not supported yet")).toBeInTheDocument();
  });

  it("should expose no connect action", () => {
    // Arrange

    // Act
    render(<NotSupportedRow config={strava} />);

    // Assert
    expect(screen.queryByRole("button")).toBeNull();
  });
});
