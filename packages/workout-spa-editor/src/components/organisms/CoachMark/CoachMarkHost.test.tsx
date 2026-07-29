/**
 * The host's contract is "anchored or not at all": it renders nothing without
 * a mark, and marks itself unanchored until the shared tooltip math has
 * produced a real position from the registry element's rect.
 */

import { render, screen } from "@testing-library/react";
import { useContext, useEffect } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  FocusRegistryContext,
  FocusRegistryProvider,
} from "../../../contexts/focus-registry-context";
import type { ActiveCoachMark } from "../../../lib/coach-marks";
import { asItemId } from "../../../store/providers/item-id";
import { CoachMarkHost } from "./CoachMarkHost";

const hoisted = vi.hoisted(() => ({
  state: {
    mark: null as ActiveCoachMark | null,
    accept: () => {},
    dismiss: () => {},
  },
}));

vi.mock("../../../hooks/coach-marks/use-coach-mark", () => ({
  useCoachMark: () => hoisted.state,
}));

const MARK: ActiveCoachMark = {
  id: "create-block",
  side: "right",
  align: "start",
  anchorId: "step-b",
};

const Anchor = ({ id }: { id: string }) => {
  const registry = useContext(FocusRegistryContext);
  useEffect(() => {
    const el = document.createElement("div");
    el.getBoundingClientRect = () =>
      ({
        top: 100,
        left: 40,
        right: 240,
        bottom: 160,
        width: 200,
        height: 60,
      }) as DOMRect;
    el.scrollIntoView = () => {};
    registry.registerItem(asItemId(id), el);
    return () => registry.unregisterItem(asItemId(id), el);
  }, [registry, id]);
  return null;
};

const renderHost = (anchorId: string | null) =>
  render(
    <FocusRegistryProvider>
      {anchorId !== null && <Anchor id={anchorId} />}
      <CoachMarkHost />
    </FocusRegistryProvider>
  );

describe("CoachMarkHost", () => {
  it("should render nothing while no mark is relevant", () => {
    // Arrange
    hoisted.state = { mark: null, accept: () => {}, dismiss: () => {} };

    // Act
    renderHost("step-b");

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render the mark once one is relevant", () => {
    // Arrange
    hoisted.state = { mark: MARK, accept: () => {}, dismiss: () => {} };

    // Act
    renderHost("step-b");

    // Assert
    expect(screen.getByTestId("coach-mark-create-block")).toBeInTheDocument();
  });

  it("should anchor the mark when its target is in the registry", () => {
    // Arrange
    hoisted.state = { mark: MARK, accept: () => {}, dismiss: () => {} };

    // Act
    renderHost("step-b");

    // Assert
    expect(screen.getByTestId("coach-mark-create-block")).toHaveAttribute(
      "data-anchored",
      "true"
    );
  });

  it("should stay unanchored rather than centre itself when the target is unknown", () => {
    // Arrange
    hoisted.state = { mark: MARK, accept: () => {}, dismiss: () => {} };

    // Act
    renderHost("some-other-step");

    // Assert
    expect(screen.getByTestId("coach-mark-create-block")).toHaveAttribute(
      "data-anchored",
      "false"
    );
  });

  it("should place the mark to the right of its anchor", () => {
    // Arrange
    hoisted.state = { mark: MARK, accept: () => {}, dismiss: () => {} };

    // Act
    renderHost("step-b");

    // Assert
    // anchor.right (240) + the tooltip atom's 5px side offset.
    expect(screen.getByTestId("coach-mark-create-block").style.left).toBe(
      "245px"
    );
  });
});
