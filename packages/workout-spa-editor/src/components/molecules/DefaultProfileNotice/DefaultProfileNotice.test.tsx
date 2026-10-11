import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import type { Profile } from "../../../types/profile";
import type { UserPreferences } from "../../../types/user-preferences";
import { DefaultProfileNotice } from "./DefaultProfileNotice";

const PROFILE_ID = "auto-1";

async function seedProfile(origin: Profile["origin"]): Promise<void> {
  const profile: Profile = {
    id: PROFILE_ID,
    name: "My profile",
    linkedAccounts: [],
    origin,
  };
  await db.table<Profile>("profiles").put(profile);
  await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
}

function ActiveProfileProbe() {
  const active = useActiveProfileLive();
  return active?.profile ? (
    <span>{`active:${active.profile.origin}`}</span>
  ) : null;
}

function renderNotice() {
  const loc = memoryLocation({ path: "/calendar", record: true });
  render(
    <Router hook={loc.hook}>
      <DefaultProfileNotice />
    </Router>
  );
  return loc;
}

describe("DefaultProfileNotice", () => {
  beforeEach(async () => {
    await db.table("profiles").clear();
    await db.table("meta").clear();
    await db.table("userPreferences").clear();
    localStorage.clear();
  });

  it("should show the notice with a link to the athlete page for an auto profile", async () => {
    // Arrange
    await seedProfile("auto");

    // Act
    renderNotice();

    // Assert
    const notice = await screen.findByTestId("default-profile-notice");
    expect(notice).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/athlete");
  });

  it("should hide the notice once the profile is claimed", async () => {
    // Arrange
    await seedProfile("auto");
    renderNotice();
    await screen.findByTestId("default-profile-notice");

    // Act
    await db.table<Profile>("profiles").update(PROFILE_ID, { origin: "local" });

    // Assert
    await waitFor(() =>
      expect(screen.queryByTestId("default-profile-notice")).toBeNull()
    );
  });

  it("should hide on dismiss without writing preferences or claiming the profile", async () => {
    // Arrange
    await seedProfile("auto");
    renderNotice();
    const notice = await screen.findByTestId("default-profile-notice");
    const dismiss = notice.querySelector("button");
    if (!dismiss) throw new Error("dismiss button missing");

    // Act
    await userEvent.click(dismiss);

    // Assert
    await waitFor(() =>
      expect(screen.queryByTestId("default-profile-notice")).toBeNull()
    );
    // A preferences row written here would carry a fresh `updatedAt` and,
    // once the profile is re-keyed onto a synced one, win LWW over that
    // profile's whole preferences row.
    const prefs = await db
      .table<UserPreferences>("userPreferences")
      .get(PROFILE_ID);
    expect(prefs).toBeUndefined();
    const profile = await db.table<Profile>("profiles").get(PROFILE_ID);
    expect(profile?.origin).toBe("auto");
  });

  it("should stay dismissed on this device after a remount", async () => {
    // Arrange
    await seedProfile("auto");
    renderNotice();
    const notice = await screen.findByTestId("default-profile-notice");
    const dismiss = notice.querySelector("button");
    if (!dismiss) throw new Error("dismiss button missing");
    await userEvent.click(dismiss);
    cleanup();

    // Act
    render(
      <>
        <ActiveProfileProbe />
        <DefaultProfileNotice />
      </>
    );

    // Assert
    // The probe reads the same live profile the notice does, so once it
    // shows, the notice has rendered with the profile loaded.
    await screen.findByText("active:auto");
    expect(screen.queryByTestId("default-profile-notice")).toBeNull();
  });
});
