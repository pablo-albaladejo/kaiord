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
import type { Profile } from "../../../types/profile";
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
  const loc = memoryLocation({ path: "/athletes", record: true });
  renderWithProviders(
    <Router hook={loc.hook}>
      <AthletesPage />
    </Router>,
    { persistence }
  );
  return loc;
}

const row = (profile: Profile) =>
  screen.findByTestId(`athlete-row-${profile.id}`);

const names = async () =>
  (await db.table<Profile>("profiles").toArray()).map((p) => p.name).sort();

describe("AthletesPage", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should list every athlete under the route heading, the active one marked", async () => {
    // Arrange
    const { pablo, laura } = await seedTwo();

    // Act
    renderPage();

    // Assert
    expect(screen.getByRole("heading", { name: "Athletes" })).toHaveAttribute(
      "data-route-heading"
    );
    expect(await screen.findByText("Athletes (2)")).toBeInTheDocument();
    expect(within(await row(pablo)).getByText("Active")).toBeInTheDocument();
    expect(within(await row(laura)).queryByText("Active")).toBeNull();
  });

  it("should create an athlete from the name field", async () => {
    // Arrange
    await seedTwo();
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Club U23");
    await user.click(screen.getByRole("button", { name: "Create athlete" }));

    // Assert
    expect(await screen.findByText("Club U23")).toBeInTheDocument();
    expect(await names()).toEqual(["Club U23", "Laura", "Pablo"]);
  });

  it("should make another athlete active", async () => {
    // Arrange
    const { laura } = await seedTwo();
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.click(
      await screen.findByRole("button", { name: "Make Laura active" })
    );

    // Assert
    await waitFor(async () =>
      expect(within(await row(laura)).getByText("Active")).toBeInTheDocument()
    );
  });

  it("should rename an athlete in place", async () => {
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
    expect(await screen.findByText("Laura M.")).toBeInTheDocument();
    expect(await names()).toEqual(["Laura M.", "Pablo"]);
  });

  it("should delete an athlete only after the confirmation", async () => {
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
    expect(await names()).toEqual(["Laura", "Pablo"]);

    // Act
    await user.click(
      within(dialog).getByRole("button", { name: "Delete athlete" })
    );

    // Assert
    await waitFor(async () => expect(await names()).toEqual(["Pablo"]));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("should not offer to delete the only athlete", async () => {
    // Arrange
    await createProfile(persistence, "Solo");

    // Act
    renderPage();

    // Assert
    expect(
      await screen.findByRole("button", { name: "Delete Solo" })
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("should import an athlete file as a new athlete", async () => {
    // Arrange
    const { laura } = await seedTwo();
    const user = userEvent.setup();
    renderPage();
    const exported = JSON.stringify({ ...laura, name: "Laura copy" });
    const file = new File([exported], "laura.json", {
      type: "application/json",
    });

    // Act
    await user.upload(screen.getByLabelText("Athlete file"), file);

    // Assert
    await waitFor(async () =>
      expect(await names()).toEqual(["Laura", "Laura copy", "Pablo"])
    );
  });

  it("should point to the backup for copying everything", async () => {
    // Arrange
    const user = userEvent.setup();
    const loc = renderPage();

    // Act
    await user.click(
      screen.getByRole("link", { name: "Open Data and backup" })
    );

    // Assert
    expect(loc.history).toContain("/settings/data");
  });
});
