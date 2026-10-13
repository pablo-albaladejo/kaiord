import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { DISCOVERY_SETTLE_MS } from "../../../hooks/connections/use-discovery-settled";
import { resetDiscoveryClock } from "../../../hooks/discovery-clock";
import { renderWithProviders } from "../../../test-utils";
import type { Profile } from "../../../types/profile";
import AthletePage from "./AthletePage";

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";
const CYCLING_FTP = 250;

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Ana Gomez",
  sportZones: {
    cycling: {
      thresholds: { ftp: CYCLING_FTP },
      heartRateZones: { method: "karvonen-5", zones: [] },
    },
  },
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function renderPage() {
  const { hook } = memoryLocation({ path: "/athlete", record: true });
  return renderWithProviders(
    <Router hook={hook}>
      <AthletePage />
    </Router>,
    { persistence: createDexiePersistence(db) }
  );
}

async function clearTables(): Promise<void> {
  await db.table("profiles").clear();
  await db.table("meta").clear();
  await db.table("integrationPolicies").clear();
}

describe("AthletePage", () => {
  beforeEach(async () => {
    resetDiscoveryClock(Date.now() - DISCOVERY_SETTLE_MS);
    await clearTables();
  });
  afterEach(async () => {
    resetDiscoveryClock();
    await clearTables();
  });

  it("should render the route heading and the active profile name", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Ana Gomez")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "Athlete" })
    ).toBeInTheDocument();
  });

  // The section moved to /settings/connections in full. Waiting for the body
  // first matters: without it the absence would also hold on the spinner.
  it("should render the profile body without a Connections section", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Ana Gomez")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: "Connections" })
    ).not.toBeInTheDocument();
  });

  it("should rename the athlete in place, without a dialog", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Rename athlete" })
    );
    expect(screen.queryByRole("dialog")).toBeNull();

    // Act
    const field = screen.getByRole("textbox", { name: "Athlete name" });
    await user.clear(field);
    await user.type(field, "Ana G.{Enter}");

    // Assert
    expect(await screen.findByText("Ana G.")).toBeInTheDocument();
    const stored = await db.table<Profile>("profiles").get(PROFILE_ID);
    expect(stored?.name).toBe("Ana G.");
  });

  it("should keep the name when the rename is cancelled with Escape", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Rename athlete" })
    );

    // Act
    await user.type(
      screen.getByRole("textbox", { name: "Athlete name" }),
      " X{Escape}"
    );

    // Assert
    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();
    const stored = await db.table<Profile>("profiles").get(PROFILE_ID);
    expect(stored?.name).toBe("Ana Gomez");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Rename athlete" })
      ).toHaveFocus()
    );
  });

  it("should render the empty state when no profile is active", async () => {
    // Arrange
    await db.table("meta").put({ key: "activeProfileId", value: null });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(screen.getByText("No athlete yet")).toBeInTheDocument();
    });
  });

  it("should send the empty state to the Athletes page to create one", async () => {
    // Arrange
    await db.table("meta").put({ key: "activeProfileId", value: null });

    // Act
    renderPage();

    // Assert
    const link = await screen.findByRole("link", { name: "Create athlete" });
    expect(link).toHaveAttribute("href", "/athletes");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should render the eager route heading even in the empty state", async () => {
    // Arrange
    await db.table("meta").put({ key: "activeProfileId", value: null });

    // Act
    const { container } = renderPage();

    // Assert
    await waitFor(() => {
      expect(screen.getByText("No athlete yet")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "Athlete" })
    ).toBeInTheDocument();
    expect(container.querySelector("[data-route-heading]")).not.toBeNull();
  });
});
