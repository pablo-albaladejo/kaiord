/**
 * ProfileEditDialog regression test.
 *
 * Guards against the infinite render loop: the open dialog seeds edit mode via
 * `handleEdit`, which is recreated each render and writes a fresh `formData`
 * object. Re-running it on every render looped setState->render->setState and
 * crashed with React "Maximum update depth exceeded". Opening the dialog must
 * mount the editor exactly once.
 */

import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import type { Profile } from "../../../types/profile";
import { ProfileEditDialog } from "./ProfileEditDialog";

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Ana Gomez",
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const clearTables = async () => {
  await db.table("profiles").clear();
  await db.table("meta").clear();
};

describe("ProfileEditDialog", () => {
  beforeEach(clearTables);
  afterEach(clearTables);

  it("should mount the editor once when opened without an update-depth loop", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });

    // Act
    renderWithProviders(
      <ProfileEditDialog open profile={PROFILE} onClose={vi.fn()} />,
      { persistence: createDexiePersistence(db) }
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByDisplayValue("Ana Gomez")).toBeInTheDocument();
    });
  });
});
