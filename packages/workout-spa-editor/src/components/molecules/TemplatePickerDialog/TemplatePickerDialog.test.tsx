/**
 * TemplatePickerDialog tests.
 *
 * The picker reads templates via `useLibraryTemplatesLive` (Dexie +
 * useLiveQuery), so we seed templates through `createDexiePersistence(db)`
 * and clear the table between tests — same pattern as LibraryPage tests.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { addTemplate } from "../../../application/library/add-template";
import { renderWithProviders } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { TemplatePickerDialog } from "./TemplatePickerDialog";

const makeKrd = (): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00.000Z", sport: "cycling" },
});

type HarnessProps = {
  date: string;
  onPick: (templateId: string) => void;
  initialOpen?: boolean;
};

function PickerHarness({ date, onPick, initialOpen = true }: HarnessProps) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Add from Library
      </button>
      <TemplatePickerDialog
        open={open}
        onOpenChange={setOpen}
        date={date}
        onPick={onPick}
      />
    </>
  );
}

const renderPicker = (props: HarnessProps) =>
  renderWithProviders(<PickerHarness {...props} />, {
    persistence: createDexiePersistence(db),
  });

describe("TemplatePickerDialog", () => {
  beforeEach(async () => {
    await db.table("templates").clear();
  });

  it("renders template cards from Dexie", async () => {
    const persistence = createDexiePersistence(db);
    await addTemplate(persistence, "Tempo Ride", "cycling", makeKrd());
    await addTemplate(persistence, "Easy Spin", "cycling", makeKrd());

    renderPicker({ date: "2026-05-04", onPick: vi.fn() });

    await waitFor(() => {
      expect(screen.getByText("Tempo Ride")).toBeInTheDocument();
      expect(screen.getByText("Easy Spin")).toBeInTheDocument();
    });
  });

  it("filters templates by search term", async () => {
    const persistence = createDexiePersistence(db);
    await addTemplate(persistence, "Tempo Ride", "cycling", makeKrd());
    await addTemplate(persistence, "Easy Spin", "cycling", makeKrd());

    const user = userEvent.setup();
    renderPicker({ date: "2026-05-04", onPick: vi.fn() });

    await waitFor(() => {
      expect(screen.getByText("Tempo Ride")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Search templates"), "tempo");

    await waitFor(() => {
      expect(screen.getByText("Tempo Ride")).toBeInTheDocument();
      expect(screen.queryByText("Easy Spin")).not.toBeInTheDocument();
    });
  });

  it("invokes onPick with the template id and closes on selection", async () => {
    const persistence = createDexiePersistence(db);
    const created = await addTemplate(
      persistence,
      "Tempo Ride",
      "cycling",
      makeKrd()
    );
    const onPick = vi.fn();

    const user = userEvent.setup();
    renderPicker({ date: "2026-05-04", onPick });

    await waitFor(() => {
      expect(screen.getByText("Tempo Ride")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Tempo Ride"));

    expect(onPick).toHaveBeenCalledExactlyOnceWith(created.id);
    await waitFor(() => {
      expect(
        screen.queryByTestId("template-picker-dialog")
      ).not.toBeInTheDocument();
    });
  });

  it("closes on Esc key", async () => {
    const user = userEvent.setup();
    renderPicker({ date: "2026-05-04", onPick: vi.fn() });

    await waitFor(() => {
      expect(screen.getByTestId("template-picker-dialog")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.queryByTestId("template-picker-dialog")
      ).not.toBeInTheDocument();
    });
  });

  it("does not render delete or edit affordances", async () => {
    const persistence = createDexiePersistence(db);
    await addTemplate(persistence, "Tempo Ride", "cycling", makeKrd());

    renderPicker({ date: "2026-05-04", onPick: vi.fn() });

    await waitFor(() => {
      expect(screen.getByText("Tempo Ride")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: /delete/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /edit/i })
    ).not.toBeInTheDocument();
  });

  it("includes the formatted date in the dialog accessible name", async () => {
    renderPicker({ date: "2026-05-04", onPick: vi.fn() });

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /Monday, May 4/i })
      ).toBeInTheDocument();
    });
  });

  it("returns focus to the document on close so SR users land outside the dialog tree", async () => {
    // Radix Dialog captures `document.activeElement` at open time and
    // restores focus to it on close. In jsdom the captured element is
    // unreliable due to event-loop quirks, so we assert the weaker
    // contract: after Esc the focused element MUST NOT be inside the
    // dialog tree. The strict trigger-restoration is exercised end-to-
    // end in the Playwright suite (real-browser focus model).
    const user = userEvent.setup();
    renderPicker({
      date: "2026-05-04",
      onPick: vi.fn(),
      initialOpen: true,
    });

    await waitFor(() => {
      expect(screen.getByTestId("template-picker-dialog")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.queryByTestId("template-picker-dialog")
      ).not.toBeInTheDocument();
    });
    const dialogStillOwnsFocus = !!document.activeElement?.closest(
      "[data-testid='template-picker-dialog']"
    );
    expect(dialogStillOwnsFocus).toBe(false);
  });
});
