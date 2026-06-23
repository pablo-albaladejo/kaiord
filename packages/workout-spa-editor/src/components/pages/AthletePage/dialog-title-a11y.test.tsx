/**
 * A11y regression for the Athlete-page wrapper dialogs.
 *
 * These reuse shared content (ProfileManagerDialog / SportZoneEditor) and
 * previously set only `aria-label` on `Dialog.Content`, which does NOT satisfy
 * Radix's Dialog.Title requirement — opening them logged "DialogContent
 * requires a DialogTitle". Each now renders a visually-hidden `Dialog.Title`,
 * so the dialog exposes an accessible name.
 */
import { screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import type { Profile } from "../../../types/profile";
import { CreateProfileDialog } from "./CreateProfileDialog";
import { ProfileEditDialog } from "./ProfileEditDialog";
import { ThresholdEditDialog } from "./ThresholdEditDialog";

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Ana Gomez",
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const seed = async () => {
  await db.table<Profile>("profiles").put(PROFILE);
  await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
};

const clear = async () => {
  await db.table("profiles").clear();
  await db.table("meta").clear();
};

const renderDialog = (ui: ReactElement) =>
  renderWithProviders(ui, { persistence: createDexiePersistence(db) });

describe("Athlete dialog accessible titles", () => {
  beforeEach(seed);
  afterEach(clear);

  it("should give the edit-profile dialog an accessible title", async () => {
    // Arrange

    // Act
    renderDialog(
      <ProfileEditDialog open profile={PROFILE} onClose={vi.fn()} />
    );

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Edit profile" })
      ).toBeInTheDocument();
    });
  });

  it("should give the create-profile dialog an accessible title", async () => {
    // Arrange

    // Act
    renderDialog(<CreateProfileDialog open onClose={vi.fn()} />);

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Create athlete profile" })
      ).toBeInTheDocument();
    });
  });

  it("should give the threshold-edit dialog an accessible title", async () => {
    // Arrange

    // Act
    renderDialog(
      <ThresholdEditDialog open profileId={PROFILE_ID} onClose={vi.fn()} />
    );

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Edit thresholds" })
      ).toBeInTheDocument();
    });
  });
});
