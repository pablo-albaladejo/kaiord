import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  SHORTCUT_CATALOG,
  SHORTCUT_GROUPS,
} from "../../../constants/shortcut-catalog";
import enHelp from "../../../i18n/locales/en/help.json";
import { ShortcutSheet } from "./ShortcutSheet";

const label = (key: string): string =>
  key
    .split(".")
    .reduce<unknown>(
      (acc, segment) => (acc as Record<string, unknown>)[segment],
      enHelp
    ) as string;

describe("ShortcutSheet", () => {
  describe("rendering", () => {
    it("should render the sheet title when open", () => {
      // Arrange

      // Act
      render(<ShortcutSheet open onOpenChange={vi.fn()} />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /keyboard shortcuts/i })
      ).toBeInTheDocument();
    });

    it("should not render anything when closed", () => {
      // Arrange

      // Act
      render(<ShortcutSheet open={false} onOpenChange={vi.fn()} />);

      // Assert
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it.each(SHORTCUT_GROUPS)("should render the %s group heading", (group) => {
      // Arrange

      // Act
      render(<ShortcutSheet open onOpenChange={vi.fn()} />);

      // Assert
      expect(
        screen.getByRole("heading", {
          name: label(`shortcuts.${group}.heading`),
        })
      ).toBeInTheDocument();
    });

    it.each(SHORTCUT_CATALOG)(
      "should render the $id row from the catalog",
      (def) => {
        // Arrange

        // Act
        render(<ShortcutSheet open onOpenChange={vi.fn()} />);

        // Assert
        expect(screen.getByText(label(def.labelKey))).toBeInTheDocument();
      }
    );

    it("should render a key chip for every catalog row", () => {
      // Arrange

      // Act
      render(<ShortcutSheet open onOpenChange={vi.fn()} />);

      // Assert
      const chips = screen.getByRole("dialog").querySelectorAll("kbd");
      expect(chips.length).toBeGreaterThanOrEqual(SHORTCUT_CATALOG.length);
    });

    it("should show the platform tag", () => {
      // Arrange

      // Act
      render(<ShortcutSheet open onOpenChange={vi.fn()} />);

      // Assert
      expect(screen.getByText(/windows \/ linux|macos/i)).toBeInTheDocument();
    });
  });

  describe("dismissal", () => {
    it("should request close when Escape is pressed", async () => {
      // Arrange
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<ShortcutSheet open onOpenChange={onOpenChange} />);

      // Act
      await user.keyboard("{Escape}");

      // Assert
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should request close when the close button is clicked", async () => {
      // Arrange
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<ShortcutSheet open onOpenChange={onOpenChange} />);

      // Act
      await user.click(screen.getByRole("button", { name: /close/i }));

      // Assert
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
