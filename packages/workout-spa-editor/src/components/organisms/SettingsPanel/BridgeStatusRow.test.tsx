import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BridgeStatusRow } from "./BridgeStatusRow";

function renderRow(props: Parameters<typeof BridgeStatusRow>[0]) {
  return render(
    <table>
      <tbody>
        <BridgeStatusRow {...props} />
      </tbody>
    </table>
  );
}

describe("BridgeStatusRow", () => {
  it("should show connected state with green dot", () => {
    // Arrange

    // Act

    renderRow({ name: "Garmin Connect", state: "connected", hint: "" });

    // Assert

    expect(screen.getByText("Garmin Connect")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByLabelText("Connected")).toHaveClass("bg-green-500");
  });

  it("should show no-session state with yellow dot and hint", () => {
    // Arrange

    // Act

    renderRow({ name: "Train2Go", state: "no-session", hint: "Log in" });

    // Assert

    expect(screen.getByText("Train2Go")).toBeInTheDocument();
    expect(screen.getByText("Session inactive")).toBeInTheDocument();
    expect(screen.getByText(/Log in/)).toBeInTheDocument();
    expect(screen.getByLabelText("Session inactive")).toHaveClass(
      "bg-yellow-500"
    );
  });

  it("should show not-detected state with gray dot and hint", () => {
    // Arrange

    // Act

    renderRow({
      name: "Garmin Connect",
      state: "not-detected",
      hint: "Install",
    });

    // Assert

    expect(screen.getByText("Not detected")).toBeInTheDocument();
    expect(screen.getByText(/Install/)).toBeInTheDocument();
    expect(screen.getByLabelText("Not detected")).toHaveClass("bg-gray-300");
  });

  it("should hide hint when connected", () => {
    // Arrange

    // Act

    renderRow({ name: "Garmin Connect", state: "connected", hint: "Unused" });

    // Assert

    expect(screen.queryByText(/Unused/)).not.toBeInTheDocument();
  });
});
