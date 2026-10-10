import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import type { Profile } from "../../../types/profile";
import type { UserPreferences } from "../../../types/user-preferences";
import { DefaultProfileNotice } from "./DefaultProfileNotice";
import { DEFAULT_PROFILE_NOTICE_ID } from "./use-default-profile-notice";

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

  it("should hide on dismiss and record it in preferences without claiming the profile", async () => {
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
    const prefs = await db
      .table<UserPreferences>("userPreferences")
      .get(PROFILE_ID);
    expect(prefs?.dismissedCoachMarks).toContain(DEFAULT_PROFILE_NOTICE_ID);
    const profile = await db.table<Profile>("profiles").get(PROFILE_ID);
    expect(profile?.origin).toBe("auto");
  });
});
