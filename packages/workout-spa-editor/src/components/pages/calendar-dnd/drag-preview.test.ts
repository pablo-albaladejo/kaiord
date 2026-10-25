import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDragPreview } from "./drag-preview";

const GRAB = 100;
const NUDGE = { x: 102, y: 101 };
const PAST_THRESHOLD = { x: 140, y: 120 };
const FAR = { x: 200, y: 160 };

const GHOST = '[aria-hidden="true"][style*="position: fixed"]';

const ghost = (): HTMLElement | null => document.body.querySelector(GHOST);

const mountCard = (): HTMLElement => {
  const card = document.createElement("div");
  card.innerHTML = '<button data-testid="workout-card" id="c1">Run</button>';
  document.body.appendChild(card);
  return card;
};

const setReducedMotion = (reduce: boolean): void => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: reduce && query.includes("reduced-motion"),
      media: query,
    }),
  });
};

describe("createDragPreview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
    document.body.removeAttribute("style");
  });

  it("should show no ghost while the pointer stays inside the click threshold", () => {
    // Arrange
    const preview = createDragPreview(mountCard(), GRAB, GRAB);

    // Act
    preview.move(NUDGE.x, NUDGE.y);

    // Assert
    expect(ghost()).toBeNull();
    expect(document.body.style.cursor).toBe("");
  });

  it("should lift a copy of the card that follows the pointer once it travels", () => {
    // Arrange
    const card = mountCard();
    const preview = createDragPreview(card, GRAB, GRAB);

    // Act
    preview.move(PAST_THRESHOLD.x, PAST_THRESHOLD.y);
    preview.move(FAR.x, FAR.y);

    // Assert
    // jsdom lays the card at (0, 0), so the copy sits at pointer − grab.
    expect(ghost()?.style.transform).toContain(
      `translate(${FAR.x - GRAB}px, ${FAR.y - GRAB}px)`
    );
    expect(card.dataset.dragging).toBe("true");
    expect(document.body.style.cursor).toBe("grabbing");
  });

  it("should strip the card's test ids and element ids from the copy", () => {
    // Arrange
    const preview = createDragPreview(mountCard(), GRAB, GRAB);

    // Act
    preview.move(PAST_THRESHOLD.x, PAST_THRESHOLD.y);

    // Assert
    expect(
      document.querySelectorAll('[data-testid="workout-card"]')
    ).toHaveLength(1);
    expect(document.querySelectorAll("#c1")).toHaveLength(1);
  });

  it("should settle the ghost onto the drop target and then remove it", () => {
    // Arrange
    const card = mountCard();
    const target = document.createElement("div");
    document.body.appendChild(target);
    const preview = createDragPreview(card, GRAB, GRAB);
    preview.move(PAST_THRESHOLD.x, PAST_THRESHOLD.y);

    // Act
    preview.end(target);
    const landing = ghost()?.style.opacity;
    vi.runAllTimers();

    // Assert
    expect(landing).toBe("0");
    expect(ghost()).toBeNull();
    expect(card.dataset.dragging).toBeUndefined();
    expect(document.body.style.cursor).toBe("");
  });

  it("should remove the ghost at once under reduced motion", () => {
    // Arrange
    setReducedMotion(true);
    const target = document.createElement("div");
    const preview = createDragPreview(mountCard(), GRAB, GRAB);
    preview.move(PAST_THRESHOLD.x, PAST_THRESHOLD.y);

    // Act
    preview.end(target);

    // Assert
    expect(ghost()).toBeNull();
  });
});
