import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { todayIsoDate } from "../../../utils/today-iso-date";
import { ScheduleDateDialog } from "./ScheduleDateDialog";

const locale = vi.hoisted(() => ({ active: "en" }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

const baseProps = {
  open: true,
  templateName: "Tempo Run",
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("ScheduleDateDialog", () => {
  afterEach(async () => {
    locale.active = "en";
    await appI18n.changeLanguage("en");
  });

  it("should propose today when no default date is given", () => {
    // Arrange
    const ui = <ScheduleDateDialog {...baseProps} />;

    // Act
    render(ui);

    // Assert
    expect(screen.getByTestId("schedule-date-input")).toHaveValue(
      todayIsoDate()
    );
  });

  it("should propose the context date it is given", () => {
    // Arrange
    const ui = <ScheduleDateDialog {...baseProps} defaultDate="2026-10-05" />;

    // Act
    render(ui);

    // Assert
    expect(screen.getByTestId("schedule-date-input")).toHaveValue("2026-10-05");
  });

  it("should propose the context date again each time it opens", async () => {
    // Arrange
    const user = userEvent.setup();
    const props = { ...baseProps, defaultDate: "2026-10-05" };
    const { rerender } = render(<ScheduleDateDialog {...props} />);

    // Act
    await user.clear(screen.getByTestId("schedule-date-input"));
    rerender(<ScheduleDateDialog {...props} open={false} />);
    rerender(<ScheduleDateDialog {...props} defaultDate="2026-10-12" />);

    // Assert
    expect(screen.getByTestId("schedule-date-input")).toHaveValue("2026-10-12");
  });

  it("should explain inline why an empty date cannot be scheduled", async () => {
    // Arrange
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ScheduleDateDialog {...baseProps} onConfirm={onConfirm} />);

    // Act
    await user.clear(screen.getByTestId("schedule-date-input"));
    await user.click(screen.getByRole("button", { name: "Schedule" }));

    // Assert
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/pick a valid date/i);
    expect(screen.getByTestId("schedule-date-input")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  it("should confirm the chosen date", async () => {
    // Arrange
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ScheduleDateDialog
        {...baseProps}
        defaultDate="2026-10-05"
        onConfirm={onConfirm}
      />
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Schedule" }));

    // Assert
    expect(onConfirm).toHaveBeenCalledWith("2026-10-05");
  });

  it("should speak Spanish when the app does", async () => {
    // Arrange
    await setActiveLocale("es");
    locale.active = "es";

    // Act
    render(<ScheduleDateDialog {...baseProps} />);

    // Assert
    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      "Programar entreno"
    );
    expect(screen.getByText(/Elige una fecha para «Tempo Run»/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Programar" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeVisible();
    expect(screen.getByLabelText("Fecha")).toBeVisible();
  });
});
