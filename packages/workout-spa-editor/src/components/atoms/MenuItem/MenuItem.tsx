import {
  Item as RadixItem,
  RadioItem as RadixRadioItem,
} from "@radix-ui/react-dropdown-menu";
import type { ComponentPropsWithRef, PointerEvent } from "react";

// Radix opens a dropdown on pointerdown and selects an item on a pointerup
// that began elsewhere (press on the trigger, release on the item). When the
// page is still scrolling under the pointer, the press that opened the menu
// ends over an item and chooses it unasked. Cancelling the pointerup skips
// that path; a press made on the item still clicks it, and the keyboard is
// untouched. Touch never reaches it: the pointer is captured by the trigger.
const ignoreForeignRelease =
  (onPointerUp?: (event: PointerEvent<HTMLDivElement>) => void) =>
  (event: PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event);
    event.preventDefault();
  };

type ItemProps = ComponentPropsWithRef<typeof RadixItem>;
type RadioItemProps = ComponentPropsWithRef<typeof RadixRadioItem>;

/** A dropdown row that only an intended press or key can choose. */
export function MenuItem({ onPointerUp, ...props }: ItemProps) {
  return (
    <RadixItem {...props} onPointerUp={ignoreForeignRelease(onPointerUp)} />
  );
}

/** The radio flavour of {@link MenuItem}, for one-of-many menus. */
export function MenuRadioItem({ onPointerUp, ...props }: RadioItemProps) {
  return (
    <RadixRadioItem
      {...props}
      onPointerUp={ignoreForeignRelease(onPointerUp)}
    />
  );
}
