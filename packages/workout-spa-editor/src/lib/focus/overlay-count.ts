/**
 * Pure DOM-walk helpers for the overlay observer.
 *
 * An "overlay" for focus-defer purposes is a Radix-owned dialog or
 * menu whose open state is expressed via `data-state="open"`. The
 * `data-radix-*` attribute filter is the availability-DoS mitigation
 * from §7.4: a foreign `<div role="dialog">` injected by an external
 * script does not qualify and therefore cannot hold focus hostage.
 */

const OVERLAY_SELECTOR =
  '[role="dialog"][data-state="open"], [role="menu"][data-state="open"]';

const hasRadixAttribute = (el: Element): boolean => {
  for (let i = 0; i < el.attributes.length; i += 1) {
    if (el.attributes[i].name.startsWith("data-radix-")) return true;
  }
  return false;
};

export const countOverlays = (root: HTMLElement): number => {
  const candidates = root.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR);
  let count = 0;
  candidates.forEach((el) => {
    if (hasRadixAttribute(el)) count += 1;
  });
  return count;
};
