import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { createProfile } from "../../../application/profile/create-profile";
import { setActiveProfile } from "../../../application/profile/set-active-profile";
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

  it("should not claim anything about the account under the menu", async () => {
    // Arrange
    // The old header looked clickable and claimed "Local account"; records
    // are not encrypted at rest, so no line says otherwise either.
    const user = userEvent.setup();
    renderMenu();

    // Act
    await user.click(screen.getByTestId("status-header-account-button"));
    const menu = await screen.findByTestId("account-menu");

    // Assert
    expect(menu).not.toHaveTextContent("Local account");
    expect(menu).not.toHaveTextContent(/encrypt/i);
  });

  describe("athlete switcher", () => {
    async function seedTwo() {
      const persistence = createDexiePersistence(db);
      const first = await createProfile(persistence, "Pablo");
      await createProfile(persistence, "Laura");
      await setActiveProfile(persistence, first.id);
      return persistence;
    }

    function renderWith(
      persistence: ReturnType<typeof createDexiePersistence>
    ) {
      const loc = memoryLocation({ path: "/daily", record: true });
      renderWithProviders(
        <Router hook={loc.hook}>
          <AccountMenu attention={false} />
        </Router>,
        { persistence }
      );
    }

    it("should list every profile as a radio with the active one checked", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWith(await seedTwo());
      await screen.findByLabelText("Account menu (Pablo)");

      // Act
      await user.click(screen.getByTestId("status-header-account-button"));

      // Assert
      const group = await screen.findByRole("group", { name: "Athlete" });
      expect(group).toBeInTheDocument();
      expect(
        await screen.findByRole("menuitemradio", { name: "Pablo" })
      ).toBeChecked();
      expect(
        screen.getByRole("menuitemradio", { name: "Laura" })
      ).not.toBeChecked();
    });

    it("should switch the active profile when another athlete is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWith(await seedTwo());
      await screen.findByLabelText("Account menu (Pablo)");
      await user.click(screen.getByTestId("status-header-account-button"));

      // Act
      await user.click(
        await screen.findByRole("menuitemradio", { name: "Laura" })
      );

      // Assert
      expect(
        await screen.findByLabelText("Account menu (Laura)")
      ).toBeInTheDocument();
    });

    it("should open the profile manager from Manage athletes", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWith(await seedTwo());
      await user.click(screen.getByTestId("status-header-account-button"));

      // Act
      await user.click(
        await screen.findByRole("menuitem", { name: "Manage athletes…" })
      );

      // Assert
      expect(
        await screen.findByRole("dialog", { name: "Manage athletes" })
      ).toBeInTheDocument();
      expect(screen.getByText("Saved Profiles (2)")).toBeInTheDocument();
    });
  });
});
