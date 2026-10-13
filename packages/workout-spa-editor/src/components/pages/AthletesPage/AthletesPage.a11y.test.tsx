import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { createProfile } from "../../../application/profile/create-profile";
import { setActiveProfile } from "../../../application/profile/set-active-profile";
import { renderWithProviders } from "../../../test-utils";
import AthletesPage from "./AthletesPage";

const persistence = createDexiePersistence(db);

const clear = async () => {
  await db.table("profiles").clear();
  await db.table("meta").clear();
};

async function seedTwo() {
  const pablo = await createProfile(persistence, "Pablo");
  const laura = await createProfile(persistence, "Laura");
  await setActiveProfile(persistence, pablo.id);
  return { pablo, laura };
}

function renderPage() {
  const loc = memoryLocation({ path: "/athletes" });
  renderWithProviders(
    <Router hook={loc.hook}>
      <AthletesPage />
    </Router>,
    { persistence }
  );
}

describe("AthletesPage focus and announcements", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should move the focus to the new link and announce the active athlete", async () => {
    // Arrange
    const { laura } = await seedTwo();
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.click(
      await screen.findByRole("button", { name: "Make Laura active" })
    );

    // Assert
    const row = await screen.findByTestId(`athlete-row-${laura.id}`);
    const link = await within(row).findByRole("link", {
      name: "Body and zones",
    });
    await waitFor(() => expect(link).toHaveFocus());
    expect(screen.getByRole("status")).toHaveTextContent(
      "Active athlete: Laura"
    );
  });

  it("should return the focus to the pencil after a rename is saved", async () => {
    // Arrange
    await seedTwo();
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Rename Laura" })
    );

    // Act
    const field = screen.getByRole("textbox", { name: "Rename Laura" });
    await user.clear(field);
    await user.type(field, "Laura M.{Enter}");

    // Assert
    const pencil = await screen.findByRole("button", {
      name: "Rename Laura M.",
    });
    await waitFor(() => expect(pencil).toHaveFocus());
  });

  it("should return the focus to the pencil when a rename is cancelled with Escape", async () => {
    // Arrange
    await seedTwo();
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Rename Laura" })
    );

    // Act
    await user.keyboard("{Escape}");

    // Assert
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Rename Laura" })).toHaveFocus()
    );
  });

  it("should focus the list heading once an athlete is deleted", async () => {
    // Arrange
    await seedTwo();
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Delete Laura" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Delete Laura?",
    });

    // Act
    await user.click(
      within(dialog).getByRole("button", { name: "Delete athlete" })
    );

    // Assert
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(screen.getByTestId("athletes-list-head")).toHaveFocus()
    );
    expect(screen.getByTestId("athletes-list-head")).toHaveTextContent(
      "Athletes (1)"
    );
  });

  it("should explain on the page why the only athlete can't be deleted", async () => {
    // Arrange
    await createProfile(persistence, "Solo");

    // Act
    renderPage();

    // Assert
    const remove = await screen.findByRole("button", { name: "Delete Solo" });
    expect(remove).toHaveAttribute("aria-disabled", "true");
    expect(remove).toHaveAccessibleDescription(
      "The only athlete can't be deleted. Create another one first."
    );
    expect(
      screen.getByText(
        "The only athlete can't be deleted. Create another one first."
      )
    ).toBeVisible();
  });
});
