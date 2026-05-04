/**
 * ProfileManager Component Tests
 *
 * Tests for profile management with redesigned layout. Phase 1B reads
 * via the Dexie live hooks and writes via the application use cases —
 * the test seeds the production Dexie singleton (fake-indexeddb-backed
 * in jsdom, D5.1) and asserts via `findBy*` so live-query reactivity
 * has time to settle.
 */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { createProfile } from "../../../application/profile/create-profile";
import { renderWithProviders } from "../../../test-utils";
import { ProfileManager } from "./ProfileManager";

const renderManager = () =>
  renderWithProviders(<ProfileManager open={true} onOpenChange={vi.fn()} />, {
    persistence: createDexiePersistence(db),
  });

const seedProfile = (name: string) =>
  createProfile(createDexiePersistence(db), name);

describe("ProfileManager", () => {
  beforeEach(async () => {
    await Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);
  });

  describe("rendering", () => {
    it("should render when open", () => {
      // Arrange

      // Act

      renderManager();

      // Assert

      expect(
        screen.getByRole("heading", { name: /profile manager/i })
      ).toBeInTheDocument();
    });

    it("should display empty state when no profiles exist", async () => {
      // Arrange

      // Act

      renderManager();

      // Assert

      expect(await screen.findByText(/no profiles yet/i)).toBeInTheDocument();
    });

    it("should display profile count", async () => {
      // Arrange

      await seedProfile("Test Profile");

      // Act

      renderManager();

      // Assert

      expect(
        await screen.findByText(/saved profiles \(1\)/i)
      ).toBeInTheDocument();
    });

    it("should not show Edit Profile card", () => {
      // Arrange

      // Act

      renderManager();

      // Assert

      expect(screen.queryByText("Edit Profile")).not.toBeInTheDocument();
    });
  });

  describe("profile creation", () => {
    it("should create a new profile with name only", async () => {
      // Arrange

      const user = userEvent.setup();
      renderManager();

      await user.type(screen.getByLabelText(/^name$/i), "New Profile");

      // Act

      await user.click(screen.getByRole("button", { name: /create profile/i }));

      // Assert

      expect(
        await screen.findByText(/saved profiles \(1\)/i)
      ).toBeInTheDocument();
      expect(await screen.findByText("New Profile")).toBeInTheDocument();
    });

    it("should disable create button when name is empty", () => {
      // Arrange

      // Act

      renderManager();

      // Assert

      expect(
        screen.getByRole("button", { name: /create profile/i })
      ).toBeDisabled();
    });

    it("should clear form after creating profile", async () => {
      // Arrange

      // Act

      // Assert

      const user = userEvent.setup();
      renderManager();

      await user.type(screen.getByLabelText(/^name$/i), "Test");
      await user.click(screen.getByRole("button", { name: /create profile/i }));

      // The input clears synchronously inside the use case continuation;
      // poll once via findBy to allow the post-resolve setState to commit.
      await vi.waitFor(() => {
        expect(screen.getByLabelText(/^name$/i)).toHaveValue("");
      });
    });
  });

  describe("profile editing", () => {
    it("should show tabs when editing a profile", async () => {
      // Arrange

      const user = userEvent.setup();
      await seedProfile("Original");
      renderManager();

      // Act

      await user.click(await screen.findByRole("button", { name: /^edit$/i }));

      // Assert

      expect(
        screen.getByRole("tab", { name: /training zones/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /personal data/i })
      ).toBeInTheDocument();
    });

    it("should show sport zone editor by default when editing", async () => {
      // Arrange

      const user = userEvent.setup();
      await seedProfile("Athlete");
      renderManager();

      // Act

      await user.click(await screen.findByRole("button", { name: /^edit$/i }));

      // Assert

      expect(
        await screen.findByRole("tab", { name: "Cycling" })
      ).toBeInTheDocument();
    });
  });

  describe("profile deletion", () => {
    it("should show delete confirmation dialog", async () => {
      // Arrange

      const user = userEvent.setup();
      await seedProfile("Profile 1");
      await seedProfile("Profile 2");
      renderManager();

      const deleteButtons = await screen.findAllByRole("button", {
        name: /^delete profile$/i,
      });

      // Act

      await user.click(deleteButtons[0]);

      // Assert

      expect(
        await screen.findByRole("heading", { name: /delete profile/i })
      ).toBeInTheDocument();
    });

    it("should delete profile after confirmation", async () => {
      // Arrange

      // Act

      // Assert

      const user = userEvent.setup();
      const persistence = createDexiePersistence(db);
      await seedProfile("Profile 1");
      await seedProfile("Profile 2");
      renderManager();

      const deleteButtons = await screen.findAllByRole("button", {
        name: /^delete profile$/i,
      });
      await user.click(deleteButtons[0]);

      const deleteButton = await screen.findByRole("button", {
        name: /^delete$/i,
      });
      await user.click(deleteButton);

      await vi.waitFor(async () => {
        const remaining = await persistence.profiles.getAll();
        expect(remaining).toHaveLength(1);
      });
    });

    it("should disable delete button when only one profile exists", async () => {
      // Arrange

      await seedProfile("Only Profile");

      renderManager();

      // Act

      const deleteButton = await screen.findByRole("button", {
        name: /^delete profile$/i,
      });

      // Assert

      expect(deleteButton).toBeDisabled();
    });
  });

  describe("active profile", () => {
    it("should set active profile", async () => {
      // Arrange

      // Act

      // Assert

      const user = userEvent.setup();
      const persistence = createDexiePersistence(db);
      await seedProfile("Profile 1"); // first → auto-active by I1
      const profile2 = await seedProfile("Profile 2");

      renderManager();

      const setActiveButtons = await screen.findAllByRole("button", {
        name: /set active/i,
      });
      await user.click(setActiveButtons[0]);

      await vi.waitFor(async () => {
        expect(await persistence.profiles.getActiveId()).toBe(profile2.id);
      });
    });
  });

  describe("profile import", () => {
    it("should have import input element", () => {
      // Arrange

      renderManager();

      // Act

      const input = document.getElementById(
        "import-profile"
      ) as HTMLInputElement;

      // Assert

      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "file");
      expect(input).toHaveAttribute("accept", ".json");
    });

    it("should show import button", () => {
      // Arrange

      // Act

      renderManager();

      // Assert

      expect(screen.getByText(/import profile/i)).toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("should surface a toast when createProfile rejects", async () => {
      // Arrange

      const user = userEvent.setup();
      const persistence = createDexiePersistence(db);
      persistence.profiles.put = vi.fn(() =>
        Promise.reject(new Error("simulated"))
      );

      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />,
        { persistence }
      );

      await user.type(screen.getByLabelText(/^name$/i), "Will Fail");

      // Act

      await user.click(screen.getByRole("button", { name: /create profile/i }));

      // Assert

      expect(
        await screen.findByText(/failed to create profile/i)
      ).toBeInTheDocument();
    });
  });
});
