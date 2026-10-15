/**
 * A profile can lack a sport's zone config (an older or imported profile).
 * The editor is a page now, so that sport must not be a dead end: the tabs
 * and the thresholds slot stay, and only the zones say there are none yet.
 */

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import { SportZoneEditor } from "./SportZoneEditor";

const PROFILE_ID = "no-zones";

describe("SportZoneEditor without a config for the sport", () => {
  beforeEach(async () => {
    await Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);
    const now = new Date().toISOString();
    await db.table("profiles").put({
      id: PROFILE_ID,
      name: "No zones",
      linkedAccounts: [],
      sportZones: {},
      createdAt: now,
      updatedAt: now,
    });
  });

  it("should keep the sport tabs and the thresholds slot", async () => {
    // Arrange
    const thresholds = <p>thresholds slot</p>;

    // Act
    renderWithProviders(
      <SportZoneEditor
        profileId={PROFILE_ID}
        initialSport="generic"
        thresholds={thresholds}
      />,
      { persistence: createDexiePersistence(db) }
    );

    // Assert
    expect(
      await screen.findByText("No zone configuration for this sport.")
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Generic" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText("thresholds slot")).toBeInTheDocument();
  });
});
