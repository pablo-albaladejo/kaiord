import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { createProfile } from "../../../application/profile/create-profile";
import { renderWithProviders } from "../../../test-utils";
import { AccountMenu } from "./AccountMenu";

function renderMenu(attention = false) {
  const loc = memoryLocation({ path: "/daily", record: true });
  renderWithProviders(
    <Router hook={loc.hook}>
      <AccountMenu attention={attention} />
    </Router>
  );
  return loc;
}

describe("AccountMenu", () => {
  beforeEach(async () => {
    await Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);
  });

  it("should name itself for the account with no profile yet", () => {
    // Arrange
    // Reachable state: first run. `useActiveProfileLive` resolves to
    // undefined until `createProfile` writes one.
    renderMenu();

    // Act
    const trigger = screen.getByTestId("status-header-account-button");

    // Assert
    expect(trigger).toHaveAccessibleName("Account menu (no active profile)");
  });

  it("should name itself for the active profile once Dexie hydrates", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await createProfile(persistence, "Test Two");
    const loc = memoryLocation({ path: "/daily", record: true });

    // Act
    renderWithProviders(
      <Router hook={loc.hook}>
        <AccountMenu attention={false} />
      </Router>,
      { persistence }
    );

    // Assert
    expect(
      await screen.findByLabelText("Account menu (Test Two)")
    ).toBeInTheDocument();
  });

  it("should hold Settings, Connections, docs and the theme toggle", async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu();

    // Act
    await user.click(screen.getByTestId("status-header-account-button"));

    // Assert
    expect(
      await screen.findByTestId("account-menu-item-settings")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("account-menu-item-connections")
    ).toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    expect(screen.getByText("Help & docs")).toBeInTheDocument();
  });

  it("should navigate to settings from the menu", async () => {
    // Arrange
    const user = userEvent.setup();
    const loc = renderMenu();

    // Act
    await user.click(screen.getByTestId("status-header-account-button"));
    await user.click(await screen.findByTestId("account-menu-item-settings"));

    // Assert
    expect(loc.history).toContain("/settings");
  });

  it("should leave the Connections row unmarked while sources are healthy", async () => {
    // Arrange
    // Reachable state: `buildConnectionAttention` returning null, which is
    // every healthy install and every cold boot.
    const user = userEvent.setup();
    renderMenu(false);

    // Act
    await user.click(screen.getByTestId("status-header-account-button"));
    await screen.findByTestId("account-menu-item-connections");

    // Assert
    expect(
      screen.queryByTestId("account-menu-connections-attention")
    ).not.toBeInTheDocument();
  });

  it("should mark the Connections row when a source needs attention", async () => {
    // Arrange
    // Reachable state: one bridge probed and answered without a session.
    const user = userEvent.setup();
    renderMenu(true);

    // Act
    await user.click(screen.getByTestId("status-header-account-button"));

    // Assert
    expect(
      await screen.findByTestId("account-menu-connections-attention")
    ).toBeInTheDocument();
  });

  it("should claim only that the account is local, never that it is encrypted", async () => {
    // Arrange
    // Records in this browser are not encrypted at rest; only sync snapshots
    // are, and only before upload.
    const user = userEvent.setup();
    renderMenu();

    // Act
    await user.click(screen.getByTestId("status-header-account-button"));
    const menu = await screen.findByTestId("account-menu");

    // Assert
    expect(menu).toHaveTextContent("Local account");
    expect(menu).not.toHaveTextContent(/encrypt/i);
  });
});
