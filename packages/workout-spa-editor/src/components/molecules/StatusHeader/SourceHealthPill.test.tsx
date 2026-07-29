import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { renderWithProviders } from "../../../test-utils";
import { SourceHealthPill } from "./SourceHealthPill";
import type { HeaderAttention } from "./use-header-attention";

const DOWN: HeaderAttention = {
  title: "1 source down",
  detail: "Kaiord cannot read from a source — signing in again may restore it",
};

function renderPill(attention: HeaderAttention | null) {
  const loc = memoryLocation({ path: "/daily", record: true });
  renderWithProviders(
    <Router hook={loc.hook}>
      <SourceHealthPill attention={attention} />
    </Router>
  );
  return loc;
}

describe("SourceHealthPill", () => {
  it("should render nothing while every source is healthy", () => {
    // Arrange
    // Reachable state: the ordinary one. `buildConnectionAttention` returns
    // null whenever no card is amber, which is what every working install
    // produces and also what a cold boot produces.
    renderPill(null);

    // Act
    const pill = screen.queryByTestId("status-header-source-health");

    // Assert
    expect(pill).toBeNull();
  });

  it("should name the count when a source is down", () => {
    // Arrange
    // Reachable state: one bridge probed and answered without a session —
    // `probeWhoopSession` writing `inactive()` is the ordinary writer.
    renderPill(DOWN);

    // Act
    const pill = screen.getByTestId("status-header-source-health");

    // Assert
    expect(pill).toHaveAccessibleName("1 source down");
  });

  it("should state the consequence and lead to all connections", async () => {
    // Arrange
    const user = userEvent.setup();
    const loc = renderPill(DOWN);

    // Act
    await user.click(screen.getByTestId("status-header-source-health"));
    const menu = await screen.findByTestId("source-health-menu");
    await user.click(screen.getByTestId("source-health-view-all"));

    // Assert
    expect(menu).toHaveTextContent(
      "Kaiord cannot read from a source — signing in again may restore it"
    );
    expect(loc.history).toContain("/settings/connections");
  });

  it("should offer no Reconnect action it cannot perform", async () => {
    // Arrange
    // Reconnecting is per-source and lives on the card. A header button
    // would have to choose a source on the user's behalf.
    const user = userEvent.setup();
    renderPill(DOWN);

    // Act
    await user.click(screen.getByTestId("status-header-source-health"));
    const menu = await screen.findByTestId("source-health-menu");

    // Assert
    expect(menu).not.toHaveTextContent(/reconnect/i);
  });
});
