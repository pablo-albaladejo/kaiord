import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import type { Profile } from "../../../types/profile";
import type { UserPreferences } from "../../../types/user-preferences";
import { AiBanner } from "./AiBanner";

const PROFILE_ID = "p1";
const NOW = "2026-05-22T10:00:00.000Z";

async function seedProfile(): Promise<void> {
  const profile: Profile = {
    id: PROFILE_ID,
    name: "Athlete",
    ftpW: 250,
    thresholdHr: 170,
    linkedAccounts: [],
  };
  await db.table<Profile>("profiles").put(profile);
  await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
}

async function seedPrefs(expanded: boolean): Promise<void> {
  const row: UserPreferences = {
    profileId: PROFILE_ID,
    calendarView: "grid",
    aiBannerExpanded: expanded,
    updatedAt: NOW,
  };
  await db.table<UserPreferences>("userPreferences").put(row);
}

async function readPrefsExpanded(): Promise<boolean | undefined> {
  const row = await db
    .table<UserPreferences>("userPreferences")
    .get(PROFILE_ID);
  return row?.aiBannerExpanded;
}

function setGenerationStatus(status: "idle" | "success") {
  return act(async () => {
    useAiRuntimeStore.setState({ generation: { status } });
  });
}

function renderBanner() {
  const { hook } = memoryLocation({ path: "/workout/new", record: true });
  return render(
    <Router hook={hook}>
      <AiBanner />
    </Router>
  );
}

describe("AiBanner", () => {
  beforeEach(async () => {
    useAiRuntimeStore.setState({ generation: { status: "idle" } });
    await db.table("userPreferences").clear();
    await db.table("profiles").clear();
    await db.table("meta").clear();
  });

  afterEach(async () => {
    await db.table("userPreferences").clear();
    await db.table("profiles").clear();
    await db.table("meta").clear();
  });

  it("should render closed by default", () => {
    // Arrange

    // Act

    renderBanner();

    // Assert

    expect(
      screen.getByRole("button", { name: /generate with ai/i })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("should expand when the header chip is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    renderBanner();

    // Act

    await user.click(screen.getByRole("button", { name: /generate with ai/i }));

    // Assert

    expect(
      screen.getByRole("button", { name: /generate with ai/i })
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("should auto-collapse after the AI generation reports success once", async () => {
    // Arrange

    const user = userEvent.setup();
    renderBanner();
    await user.click(screen.getByRole("button", { name: /generate with ai/i }));

    // Act

    await setGenerationStatus("success");

    // Assert

    expect(
      screen.getByRole("button", { name: /generate with ai/i })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("should NOT auto-collapse on subsequent success events without a fresh expand", async () => {
    // Arrange

    const user = userEvent.setup();
    renderBanner();
    await user.click(screen.getByRole("button", { name: /generate with ai/i }));
    await setGenerationStatus("success");

    // Act

    await setGenerationStatus("idle");
    await setGenerationStatus("success");

    // Assert

    expect(
      screen.getByRole("button", { name: /generate with ai/i })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("should seed open=true when userPreferences.aiBannerExpanded is persisted", async () => {
    // Arrange
    await seedProfile();
    await seedPrefs(true);

    // Act
    renderBanner();

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generate with ai/i })
      ).toHaveAttribute("aria-expanded", "true");
    });
  });

  it("should write aiBannerExpanded=true when the user expands the banner", async () => {
    // Arrange
    await seedProfile();
    const user = userEvent.setup();
    renderBanner();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generate with ai/i })
      ).toHaveAttribute("aria-expanded", "false");
    });

    // Act
    await user.click(screen.getByRole("button", { name: /generate with ai/i }));

    // Assert
    await waitFor(async () => {
      expect(await readPrefsExpanded()).toBe(true);
    });
  });

  it("should write aiBannerExpanded=false when auto-collapse fires", async () => {
    // Arrange
    await seedProfile();
    const user = userEvent.setup();
    renderBanner();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generate with ai/i })
      ).toHaveAttribute("aria-expanded", "false");
    });
    await user.click(screen.getByRole("button", { name: /generate with ai/i }));

    // Act
    await setGenerationStatus("success");

    // Assert
    await waitFor(async () => {
      expect(await readPrefsExpanded()).toBe(false);
    });
  });
});
