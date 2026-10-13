import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useConnectionSources } from "../../../hooks/connections/use-connection-sources";
import type { Profile } from "../../../types/profile";
import { AthleteConnectionsLink } from "./AthleteConnectionsLink";

vi.mock("../../../hooks/connections/use-connection-sources", () => ({
  useConnectionSources: vi.fn(),
}));

const source = (over: Partial<ConnectionSource> = {}): ConnectionSource => ({
  id: "garmin",
  name: "Garmin",
  mark: "G",
  mechanism: "bridge",
  bridgeId: "garmin-bridge",
  status: "available",
  bridgeDetected: false,
  disconnected: false,
  needsReauth: false,
  outdated: false,
  sessionVerifiable: true,
  lastSyncAt: undefined,
  importTypes: [],
  exportTypes: [],
  ...over,
});

const profile = (linked: string[] = []): Profile => ({
  id: "p1",
  name: "Ana",
  sportZones: {},
  linkedAccounts: linked.map((id) => ({
    source: id,
    externalUserId: "1",
    externalUserName: "Ana",
    linkedAt: "2026-04-28T10:00:00.000Z",
  })),
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
});

const renderLink = (p: Profile) => {
  const { hook } = memoryLocation({ path: "/athlete" });
  return render(
    <Router hook={hook}>
      <AthleteConnectionsLink profile={p} />
    </Router>
  );
};

describe("AthleteConnectionsLink", () => {
  beforeEach(() => {
    vi.mocked(useConnectionSources).mockReturnValue([
      source(),
      source({ id: "train2go", name: "Train2Go", bridgeId: "train2go-bridge" }),
      source({ id: "manual", name: "Manual entry", status: "manual" }),
    ]);
  });

  // P-07: the link used to appear only for a linked Train2Go account, so an
  // athlete fed by Garmin alone had no way from here to their connections.
  it("should chip a connected source the athlete has no linked account for", () => {
    // Arrange
    vi.mocked(useConnectionSources).mockReturnValue([
      source({ status: "connected", bridgeDetected: true }),
    ]);

    // Act
    renderLink(profile());

    // Assert
    const link = screen.getByTestId("athlete-connections-link");
    expect(link).toHaveAttribute("href", "/connections");
    expect(
      within(link).getByTestId("athlete-connection-chip-garmin")
    ).toHaveTextContent("Garmin");
  });

  it("should chip a linked account whose extension is not in this browser", () => {
    // Arrange

    // Act
    renderLink(profile(["train2go"]));

    // Assert
    expect(
      screen.getByTestId("athlete-connection-chip-train2go")
    ).toHaveTextContent("Train2Go");
    expect(
      screen.queryByTestId("athlete-connection-chip-garmin")
    ).not.toBeInTheDocument();
  });

  it("should chip a source once when it is both connected and linked", () => {
    // Arrange
    vi.mocked(useConnectionSources).mockReturnValue([
      source({
        id: "train2go",
        name: "Train2Go",
        status: "connected",
        bridgeDetected: true,
      }),
    ]);

    // Act
    renderLink(profile(["train2go"]));

    // Assert
    expect(
      screen.getAllByTestId("athlete-connection-chip-train2go")
    ).toHaveLength(1);
  });

  it("should still lead to Connections when nothing is connected", () => {
    // Arrange

    // Act
    renderLink(profile());

    // Assert
    const link = screen.getByTestId("athlete-connections-link");
    expect(link).toHaveAttribute("href", "/connections");
    expect(link).toHaveTextContent("No connections yet");
    expect(
      within(link).queryByTestId(/^athlete-connection-chip-/)
    ).not.toBeInTheDocument();
  });
});
