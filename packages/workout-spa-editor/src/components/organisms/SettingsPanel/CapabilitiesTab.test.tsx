import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { CapabilitiesProvider } from "../../../contexts/capabilities-context";
import { renderWithProviders } from "../../../test-utils";
import {
  CAPABILITY_TEST_PROFILE_ID,
  clearCapabilities,
  seedCapabilities,
} from "../../../test-utils/seed-capabilities";
import { CapabilitiesTab } from "./CapabilitiesTab";

const renderTab = () =>
  renderWithProviders(
    <CapabilitiesProvider>
      <CapabilitiesTab />
    </CapabilitiesProvider>,
    { persistence: createDexiePersistence(db) }
  );

const decisions = async () =>
  Object.fromEntries(
    (
      await db
        .table("capabilityDecisions")
        .where("profileId")
        .equals(CAPABILITY_TEST_PROFILE_ID)
        .toArray()
    ).map((d) => [d.capabilityId, d.on])
  );

describe("CapabilitiesTab", () => {
  afterEach(clearCapabilities);

  it("should list Templates off for a new athlete", async () => {
    // Arrange
    await seedCapabilities([]);

    // Act
    renderTab();

    // Assert
    const toggle = await screen.findByRole("switch", { name: "Templates" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("should activate Templates in one step", async () => {
    // Arrange
    await seedCapabilities([]);
    const user = userEvent.setup();
    renderTab();

    // Act
    await user.click(await screen.findByRole("switch", { name: "Templates" }));

    // Assert
    await waitFor(async () =>
      expect(await decisions()).toEqual({ templates: true })
    );
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: "Templates" })).toHaveAttribute(
        "aria-checked",
        "true"
      )
    );
  });

  it("should deactivate Templates and keep the templates", async () => {
    // Arrange
    await seedCapabilities(["templates"]);
    await db.table("templates").put({ id: "t1", name: "Tempo", sport: "run" });
    const user = userEvent.setup();
    renderTab();
    const toggle = await screen.findByRole("switch", { name: "Templates" });
    await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "true"));

    // Act
    await user.click(toggle);

    // Assert
    await waitFor(async () =>
      expect(await decisions()).toEqual({ templates: false })
    );
    expect(await db.table("templates").count()).toBe(1);
    await db.table("templates").clear();
  });
});
