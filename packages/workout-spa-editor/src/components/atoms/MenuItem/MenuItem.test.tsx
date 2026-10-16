import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, userEvent } from "../../../test-utils";
import { MenuItem, MenuRadioItem } from "./MenuItem";

const renderMenu = (onSelect = vi.fn(), onPointerUp = vi.fn()) => {
  render(
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>More</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content>
          <MenuItem onSelect={onSelect} onPointerUp={onPointerUp}>
            Remove
          </MenuItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
  return { onSelect, onPointerUp };
};

const renderRadioMenu = (onValueChange = vi.fn()) => {
  render(
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Athlete</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content>
          <DropdownMenu.RadioGroup value="a" onValueChange={onValueChange}>
            <MenuRadioItem value="a">Ana</MenuRadioItem>
            <MenuRadioItem value="b">Bea</MenuRadioItem>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
  return onValueChange;
};

const item = () => screen.getByRole("menuitem", { name: "Remove" });

describe("MenuItem", () => {
  it("should not select on a release that did not start on it", () => {
    // Arrange
    const { onSelect } = renderMenu();

    // Act
    fireEvent.pointerUp(item(), { pointerType: "mouse" });

    // Assert
    expect(onSelect).not.toHaveBeenCalled();
    expect(item()).toBeVisible();
  });

  it("should still hand the release to the caller's own handler", () => {
    // Arrange
    const { onPointerUp } = renderMenu();

    // Act
    fireEvent.pointerUp(item(), { pointerType: "mouse" });

    // Assert
    expect(onPointerUp).toHaveBeenCalledOnce();
  });

  it("should select on a mouse click made on it", async () => {
    // Arrange
    const { onSelect } = renderMenu();

    // Act
    await userEvent.click(item());

    // Assert
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("should select on a touch tap made on it", async () => {
    // Arrange
    const { onSelect } = renderMenu();

    // Act
    await userEvent.pointer({ keys: "[TouchA]", target: item() });

    // Assert
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it.each(["{Enter}", " "])("should select on the %s key", async (key) => {
    // Arrange
    const { onSelect } = renderMenu();
    item().focus();

    // Act
    await userEvent.keyboard(key);

    // Assert
    expect(onSelect).toHaveBeenCalledOnce();
  });
});

describe("MenuRadioItem", () => {
  it("should not choose on a release that did not start on it", () => {
    // Arrange
    const onValueChange = renderRadioMenu();

    // Act
    fireEvent.pointerUp(screen.getByRole("menuitemradio", { name: "Bea" }), {
      pointerType: "mouse",
    });

    // Assert
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("should choose on a click made on it", async () => {
    // Arrange
    const onValueChange = renderRadioMenu();

    // Act
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Bea" }));

    // Assert
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});
