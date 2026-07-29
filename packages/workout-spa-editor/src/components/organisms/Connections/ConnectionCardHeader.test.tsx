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
    // Pinned as the concept, not as one sentence: what the card owes the
    // reader is the failed read plus both possible causes, not a fixed string.
    expect(screen.getByText(/could not read from this source/i)).toBeInTheDocument();
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
  });

  // `status` is the only input that reaches the link, so the fixtures vary
  // only that. An earlier version of this test set `bridgeDetected: false` and
  // titled itself "when the extension is simply not running" — but that field
  // steers nothing here, and a missing extension always resolves to
  // `available`, never `attention`, so the scenario in the title could not
  // have produced a link under any value. Which statuses are link-free is
  // settled in source-fix-link.test.ts; what this pins is that the COMPONENT
  // renders nothing when the derivation returns null.
  it.each([{ status: "connected" as const }, { status: "available" as const }])(
    "should render no link when the derivation returns null ($status)",
    ({ status }) => {
      // Arrange

      // Act
      render(<ConnectionCardHeader source={source({ status })} />);

      // Assert
      expect(
        screen.queryByTestId("connection-fix-whoop")
      ).not.toBeInTheDocument();
    }
  );
});
