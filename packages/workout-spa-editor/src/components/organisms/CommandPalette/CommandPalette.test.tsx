import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EditorCommand } from "../../../hooks/editor-command.types";
import { CommandPalette } from "./CommandPalette";

const hoisted = vi.hoisted(() => ({
  runGroup: vi.fn(),
  runUndo: vi.fn(),
  runLearn: vi.fn(),
  groupEnabled: true,
}));

vi.mock("../../../hooks/use-editor-commands", () => ({
  useEditorCommands: () => ({
    commands: [
      {
        id: "create-block",
        group: "do",
        titleKey: "commands.create-block.title",
        subtitleKey: hoisted.groupEnabled
          ? "commands.create-block.subtitle"
          : "commands.create-block.requires",
        shortcutId: "create-block",
        enabled: hoisted.groupEnabled,
        run: hoisted.runGroup,
      },
      {
        id: "undo",
        group: "do",
        titleKey: "commands.undo.title",
        shortcutId: "undo",
        enabled: true,
        run: hoisted.runUndo,
      },
      {
        id: "learn-formats",
        group: "learn",
        titleKey: "learn.formats.title",
        enabled: true,
        run: hoisted.runLearn,
      },
    ] satisfies ReadonlyArray<EditorCommand>,
  }),
}));

const open = (onOpenChange = vi.fn(), onShowShortcuts = vi.fn()) => {
  render(
    <CommandPalette
      open
      onOpenChange={onOpenChange}
      onShowShortcuts={onShowShortcuts}
    />
  );
  return { onOpenChange, onShowShortcuts };
};

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.groupEnabled = true;
  });

  describe("rendering", () => {
    it("should render both group headings", () => {
      // Arrange

      // Act
      open();

      // Assert
      expect(
        screen.getByRole("heading", { name: "Do it" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Learn" })
      ).toBeInTheDocument();
    });

    it("should not render anything when closed", () => {
      // Arrange

      // Act
      render(
        <CommandPalette
          open={false}
          onOpenChange={vi.fn()}
          onShowShortcuts={vi.fn()}
        />
      );

      // Assert
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should focus the search input on open", () => {
      // Arrange

      // Act
      open();

      // Assert
      expect(screen.getByRole("combobox")).toHaveFocus();
    });

    it("should render the key chips of a command with a catalog row", () => {
      // Arrange

      // Act
      open();

      // Assert
      const row = screen.getByTestId("command-palette-row-undo");
      expect(row.querySelectorAll("kbd").length).toBeGreaterThan(0);
    });

    it("should link out to the documentation", () => {
      // Arrange

      // Act
      open();

      // Assert
      expect(
        screen.getByRole("link", { name: /full documentation/i })
      ).toHaveAttribute("href", "https://kaiord.com/docs/");
    });
  });

  describe("filtering", () => {
    it("should keep only the matching rows while typing", async () => {
      // Arrange
      const user = userEvent.setup();
      open();

      // Act
      await user.type(screen.getByRole("combobox"), "undo");

      // Assert
      expect(
        screen.getByTestId("command-palette-row-undo")
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("command-palette-row-create-block")
      ).not.toBeInTheDocument();
    });

    it("should show the empty state when nothing matches", async () => {
      // Arrange
      const user = userEvent.setup();
      open();

      // Act
      await user.type(screen.getByRole("combobox"), "zzzzz");

      // Assert
      expect(screen.getByText(/nothing matches/i)).toBeInTheDocument();
    });
  });

  describe("keyboard", () => {
    it("should run the first command on Enter", async () => {
      // Arrange
      const user = userEvent.setup();
      const { onOpenChange } = open();

      // Act
      await user.keyboard("{Enter}");

      // Assert
      expect(hoisted.runGroup).toHaveBeenCalledOnce();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should move the active row with ArrowDown before running", async () => {
      // Arrange
      const user = userEvent.setup();
      open();

      // Act
      await user.keyboard("{ArrowDown}{Enter}");

      // Assert
      expect(hoisted.runUndo).toHaveBeenCalledOnce();
      expect(hoisted.runGroup).not.toHaveBeenCalled();
    });

    it("should move back up with ArrowUp", async () => {
      // Arrange
      const user = userEvent.setup();
      open();

      // Act
      await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");

      // Assert
      expect(hoisted.runGroup).toHaveBeenCalledOnce();
    });

    it("should publish the active row through aria-activedescendant", async () => {
      // Arrange
      const user = userEvent.setup();
      open();

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-activedescendant",
        "command-palette-option-undo"
      );
    });

    it("should request close on Escape", async () => {
      // Arrange
      const user = userEvent.setup();
      const { onOpenChange } = open();

      // Act
      await user.keyboard("{Escape}");

      // Assert
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("disabled rows", () => {
    it("should render a disabled command without running it on click", async () => {
      // Arrange
      hoisted.groupEnabled = false;
      const user = userEvent.setup();
      open();

      // Act
      await user.click(screen.getByTestId("command-palette-row-create-block"));

      // Assert
      expect(hoisted.runGroup).not.toHaveBeenCalled();
      expect(
        screen.getByTestId("command-palette-row-create-block")
      ).toHaveAttribute("aria-disabled", "true");
    });

    it("should not run a disabled command on Enter", async () => {
      // Arrange
      hoisted.groupEnabled = false;
      const user = userEvent.setup();
      const { onOpenChange } = open();

      // Act
      await user.keyboard("{Enter}");

      // Assert
      expect(hoisted.runGroup).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("should explain the closed guard in the subtitle", () => {
      // Arrange
      hoisted.groupEnabled = false;

      // Act
      open();

      // Assert
      expect(screen.getByText("Select 2 or more steps")).toBeInTheDocument();
    });
  });

  describe("running by click", () => {
    it("should run an enabled command and close", async () => {
      // Arrange
      const user = userEvent.setup();
      const { onOpenChange } = open();

      // Act
      await user.click(screen.getByTestId("command-palette-row-learn-formats"));

      // Assert
      expect(hoisted.runLearn).toHaveBeenCalledOnce();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("footer", () => {
    it("should hand over to the shortcut sheet", async () => {
      // Arrange
      const user = userEvent.setup();
      const { onShowShortcuts } = open();

      // Act
      await user.click(screen.getByRole("button", { name: /all shortcuts/i }));

      // Assert
      expect(onShowShortcuts).toHaveBeenCalledOnce();
    });
  });

  // The parent never unmounts (useLazyDialog latches `mounted`), so the query
  // and the active row must reset by living inside Dialog.Content.
  describe("state across openings", () => {
    const reopen = async (typed: string) => {
      const user = userEvent.setup();
      const { rerender } = render(
        <CommandPalette open onOpenChange={vi.fn()} onShowShortcuts={vi.fn()} />
      );
      await user.type(screen.getByRole("combobox"), typed);
      rerender(
        <CommandPalette
          open={false}
          onOpenChange={vi.fn()}
          onShowShortcuts={vi.fn()}
        />
      );
      rerender(
        <CommandPalette open onOpenChange={vi.fn()} onShowShortcuts={vi.fn()} />
      );
      return user;
    };

    it("should clear the query when reopened", async () => {
      // Arrange

      // Act
      await reopen("undo");

      // Assert
      expect(screen.getByRole("combobox")).toHaveValue("");
    });

    it("should show every row again when reopened", async () => {
      // Arrange

      // Act
      await reopen("undo");

      // Assert
      expect(
        screen.getByTestId("command-palette-row-create-block")
      ).toBeInTheDocument();
    });

    it("should reset the active row, so Enter runs the first command again", async () => {
      // Arrange
      const user = userEvent.setup();
      const { rerender } = render(
        <CommandPalette open onOpenChange={vi.fn()} onShowShortcuts={vi.fn()} />
      );
      await user.keyboard("{ArrowDown}");
      rerender(
        <CommandPalette
          open={false}
          onOpenChange={vi.fn()}
          onShowShortcuts={vi.fn()}
        />
      );

      // Act
      rerender(
        <CommandPalette open onOpenChange={vi.fn()} onShowShortcuts={vi.fn()} />
      );
      await user.keyboard("{Enter}");

      // Assert
      expect(hoisted.runGroup).toHaveBeenCalledOnce();
      expect(hoisted.runUndo).not.toHaveBeenCalled();
    });
  });

  describe("combobox wiring", () => {
    it("should control the listbox while there are results", () => {
      // Arrange

      // Act
      open();

      // Assert
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-controls",
        "command-palette-list"
      );
    });

    it("should drop the dangling controls and expanded state when empty", async () => {
      // Arrange
      const user = userEvent.setup();
      open();

      // Act
      await user.type(screen.getByRole("combobox"), "zzzzz");

      // Assert
      const input = screen.getByRole("combobox");
      expect(input).not.toHaveAttribute("aria-controls");
      expect(input).toHaveAttribute("aria-expanded", "false");
    });

    it("should announce the empty state through a live region", async () => {
      // Arrange
      const user = userEvent.setup();
      open();

      // Act
      await user.type(screen.getByRole("combobox"), "zzzzz");

      // Assert
      expect(screen.getByRole("status")).toHaveTextContent(/nothing matches/i);
    });
  });
});
