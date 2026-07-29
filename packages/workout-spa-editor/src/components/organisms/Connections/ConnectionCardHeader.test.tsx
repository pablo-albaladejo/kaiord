import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type {
  ConnectionSource,
  ConnectionSourceStatus,
} from "../../../application/connections/connection-source";
import { ConnectionCardHeader } from "./ConnectionCardHeader";

const source = (
  over: Partial<ConnectionSource> & { status: ConnectionSourceStatus }
): ConnectionSource => ({
  id: "whoop",
  name: "WHOOP",
  mark: "Wh",
  mechanism: "bridge",
  bridgeId: "whoop-bridge",
  bridgeDetected: true,
  disconnected: false,
  needsReauth: false,
  outdated: false,
  sessionVerifiable: true,
  lastSyncAt: undefined,
  importTypes: [],
  exportTypes: [],
  ...over,
});

describe("ConnectionCardHeader", () => {
  it("should offer the provider's own sign-in page beside the problem it names", () => {
    // Arrange

    // Act
    render(<ConnectionCardHeader source={source({ status: "attention" })} />);

    // Assert
    const link = screen.getByTestId("connection-fix-whoop");
    expect(link).toHaveAttribute("href", "https://app.whoop.com/");
    expect(link).toHaveTextContent("Sign in at WHOOP");
    // A new tab must not hand the opener a window handle it can navigate.
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  // The card still has to say what is wrong: a link that replaced the
  // sentence would leave the user clicking without knowing why.
  it("should keep naming the problem alongside the link", () => {
    // Arrange

    // Act
    render(<ConnectionCardHeader source={source({ status: "attention" })} />);

    // Assert
    expect(
      screen.getByText(/Open the provider's site and sign in/)
    ).toBeInTheDocument();
  });

  // The reachable regression: offering the sign-in page to someone whose
  // extension is not installed. Signing in fixes nothing for them, and the
  // card's own copy already tells them what does.
  it("should offer no link when the extension is simply not running", () => {
    // Arrange
    const undetected = source({ status: "available", bridgeDetected: false });

    // Act
    render(<ConnectionCardHeader source={undetected} />);

    // Assert
    expect(
      screen.queryByTestId("connection-fix-whoop")
    ).not.toBeInTheDocument();
  });

  it("should offer no link while the source is healthy", () => {
    // Arrange

    // Act
    render(<ConnectionCardHeader source={source({ status: "connected" })} />);

    // Assert
    expect(
      screen.queryByTestId("connection-fix-whoop")
    ).not.toBeInTheDocument();
  });
});
