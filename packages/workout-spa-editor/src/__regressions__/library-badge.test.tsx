/**
 * Library badge regression suite.
 *
 * Locks in Phase 2's reactive read for the library count: a fresh
 * mount over pre-populated Dexie shows the correct badge without any
 * user interaction. Pre-Phase 2 the Zustand store loaded empty on
 * boot, so the badge showed "0" until the user opened the library
 * dialog and triggered a write.
 *
 * The test seeds the production Dexie singleton (fake-indexeddb-backed
 * in jsdom — D5.1) BEFORE mounting LayoutHeader; the
 * `useLibraryTemplatesLive` hook resolves on first render and the
 * badge counter renders the persisted count.
 */

import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import { addTemplate } from "../application/library/add-template";
import { LayoutHeader } from "../components/templates/MainLayout/LayoutHeader";
import { renderWithProviders } from "../test-utils";
import type { KRD } from "../types/krd";

const makeKrd = (): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-04-30T00:00:00Z", sport: "cycling" },
});

const clear = () =>
  Promise.all([
    db.table("templates").clear(),
    db.table("profiles").clear(),
    db.table("meta").clear(),
  ]);

describe("Library badge regressions", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should show the correct badge count after a fresh mount over pre-populated Dexie", async () => {
    // Arrange

    const persistence = createDexiePersistence(db);
    await addTemplate(persistence, "Workout 1", "running", makeKrd());
    await addTemplate(persistence, "Workout 2", "cycling", makeKrd());

    // Act

    renderWithProviders(<LayoutHeader />, { persistence });

    // Assert

    expect(
      await screen.findByLabelText(/2 workouts in library/i)
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
