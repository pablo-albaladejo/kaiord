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
  it("shows connected state with green dot", () => {
    renderRow({ name: "Garmin Connect", state: "connected", hint: "" });

    expect(screen.getByText("Garmin Connect")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByLabelText("Connected")).toHaveClass("bg-green-500");
  });

  it("shows no-session state with yellow dot and hint", () => {
    renderRow({ name: "Train2Go", state: "no-session", hint: "Log in" });

    expect(screen.getByText("Train2Go")).toBeInTheDocument();
    expect(screen.getByText("Session inactive")).toBeInTheDocument();
    expect(screen.getByText(/Log in/)).toBeInTheDocument();
    expect(screen.getByLabelText("Session inactive")).toHaveClass(
      "bg-yellow-500"
    );
  });

  it("shows not-detected state with gray dot and hint", () => {
    renderRow({ name: "Garmin Connect", state: "not-detected", hint: "Install" });

    expect(screen.getByText("Not detected")).toBeInTheDocument();
    expect(screen.getByText(/Install/)).toBeInTheDocument();
    expect(screen.getByLabelText("Not detected")).toHaveClass("bg-gray-300");
  });

  it("hides hint when connected", () => {
    renderRow({ name: "Garmin Connect", state: "connected", hint: "Unused" });

    expect(screen.queryByText(/Unused/)).not.toBeInTheDocument();
  });
});
