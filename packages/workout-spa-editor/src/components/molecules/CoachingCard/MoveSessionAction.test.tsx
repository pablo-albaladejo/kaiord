/**
 * The coaching dialog's **Move to another day** (design §3.8, AC-12): it
 * opens the shared date picker on the session's day, hands the picked day
 * on, and is disabled with the reason when the session can't move.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { MoveSessionAction } from "./MoveSessionAction";

const locale = vi.hoisted(() => ({ active: "en" }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

describe("MoveSessionAction", () => {
  afterEach(async () => {
    locale.active = "en";
    await appI18n.changeLanguage("en");
  });

  it("should move the session to the day picked in the shared date picker", async () => {
    // Arrange
    const user = userEvent.setup();
    const onMoveTo = vi.fn();
    render(
      <MoveSessionAction
        date="2026-10-06"
        movability={{ movable: true }}
        onMoveTo={onMoveTo}
      />
    );

    // Act
    await user.click(
      screen.getByRole("button", { name: "Move to another day" })
    );
    const input = screen.getByTestId("schedule-date-input");
    await user.clear(input);
    await user.type(input, "2026-10-08");
    await user.click(screen.getByRole("button", { name: "Move" }));

    // Assert
    expect(onMoveTo).toHaveBeenCalledWith("2026-10-08");
  });

  it("should propose the session's own day when the picker opens", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MoveSessionAction
        date="2026-10-06"
        movability={{ movable: true }}
        onMoveTo={vi.fn()}
      />
    );

    // Act
    await user.click(
      screen.getByRole("button", { name: "Move to another day" })
    );

    // Assert
    expect(screen.getByTestId("schedule-date-input")).toHaveValue("2026-10-06");
  });

  it("should be disabled with the reason when the session is done", () => {
    // Arrange
    const movability = { movable: false, reason: "executed" } as const;

    // Act
    render(
      <MoveSessionAction
        date="2026-10-06"
        movability={movability}
        onMoveTo={vi.fn()}
      />
    );

    // Assert
    const button = screen.getByRole("button", { name: "Move to another day" });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription(
      "Already done — it can't be moved."
    );
  });

  it("should name a completed activity as the reason, in Spanish too", async () => {
    // Arrange
    await setActiveLocale("es");
    locale.active = "es";
    const movability = { movable: false, reason: "completed" } as const;

    // Act
    render(
      <MoveSessionAction
        date="2026-10-06"
        movability={movability}
        onMoveTo={vi.fn()}
      />
    );

    // Assert
    const button = screen.getByRole("button", { name: "Mover a otro día" });
    expect(button).toHaveAccessibleDescription(
      "El entrenador la marcó como completada: no se puede mover."
    );
  });
});
