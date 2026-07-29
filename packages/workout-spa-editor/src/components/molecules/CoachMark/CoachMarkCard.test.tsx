import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SHORTCUT_CATALOG } from "../../../constants/shortcut-catalog";
import enCoach from "../../../i18n/locales/en/coach.json";
import { COACH_MARKS } from "../../../lib/coach-marks";
import { CoachMarkCard } from "./CoachMarkCard";

const noop = () => {};

describe("CoachMarkCard", () => {
  it("should render the mark's title and body", () => {
    // Arrange
    const copy = enCoach.marks["create-block"];

    // Act
    render(
      <CoachMarkCard markId="create-block" onAccept={noop} onDismiss={noop} />
    );

    // Assert
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.body)).toBeInTheDocument();
  });

  it("should render the catalog key chips for the shortcut it teaches", () => {
    // Arrange
    const def = SHORTCUT_CATALOG.find((row) => row.id === "create-block");

    // Act
    const { container } = render(
      <CoachMarkCard markId="create-block" onAccept={noop} onDismiss={noop} />
    );

    // Assert
    expect(def).toBeDefined();
    expect(container.querySelectorAll("kbd").length).toBeGreaterThan(0);
  });

  it("should call onAccept when the primary action is used", async () => {
    // Arrange
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(
      <CoachMarkCard
        markId="create-block"
        onAccept={onAccept}
        onDismiss={noop}
      />
    );

    // Act
    await user.click(
      screen.getByRole("button", { name: enCoach.marks["create-block"].action })
    );

    // Assert
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it("should call onDismiss when the mark is waved away", async () => {
    // Arrange
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <CoachMarkCard
        markId="create-block"
        onAccept={noop}
        onDismiss={onDismiss}
      />
    );

    // Act
    await user.click(
      screen.getByRole("button", { name: enCoach.actions.notNow })
    );

    // Assert
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

describe("coach-mark copy", () => {
  it.each(COACH_MARKS.map((def) => def.id))(
    "should document %s with a real shortcut-catalog row",
    (id) => {
      // Arrange
      const ids = SHORTCUT_CATALOG.map((row) => row.id);

      // Act
      const documented = ids.includes(id);

      // Assert
      expect(documented).toBe(true);
    }
  );

  it.each(COACH_MARKS.map((def) => def.id))(
    "should give %s a full set of copy keys",
    (id) => {
      // Arrange
      const marks: Record<string, Record<string, string>> = enCoach.marks;

      // Act
      const copy = marks[id];

      // Assert
      expect(Object.keys(copy ?? {}).sort()).toEqual([
        "action",
        "body",
        "shortcutHint",
        "title",
      ]);
    }
  );
});
