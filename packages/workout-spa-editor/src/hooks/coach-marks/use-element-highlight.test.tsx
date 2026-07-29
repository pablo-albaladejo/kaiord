/**
 * `useElementHighlight` resolves a coach mark's anchor through
 * `FocusRegistryContext`, not through `document.querySelector`. These tests
 * pin the two behaviours that matter: a registered id resolves to the exact
 * node the card registered, and an unregistered id resolves to `null` so the
 * host can decline to render rather than point at nothing.
 */

import { render } from "@testing-library/react";
import { useContext, useEffect } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  FocusRegistryContext,
  FocusRegistryProvider,
} from "../../contexts/focus-registry-context";
import { asItemId } from "../../store/providers/item-id";
import { useElementHighlight } from "./use-element-highlight";

type ProbeProps = {
  open: boolean;
  itemId?: string | null;
  registerAs?: string;
  sink: { current: HTMLElement | null };
  element?: HTMLElement;
};

const Probe = ({ open, itemId, registerAs, sink, element }: ProbeProps) => {
  const registry = useContext(FocusRegistryContext);
  useEffect(() => {
    if (!registerAs || !element) return;
    registry.registerItem(asItemId(registerAs), element);
    return () => registry.unregisterItem(asItemId(registerAs), element);
  }, [registry, registerAs, element]);
  sink.current = useElementHighlight(open, itemId);
  return null;
};

const renderProbe = (props: Omit<ProbeProps, "sink">) => {
  const sink = { current: null as HTMLElement | null };
  render(
    <FocusRegistryProvider>
      <Probe {...props} sink={sink} />
    </FocusRegistryProvider>
  );
  return sink;
};

describe("useElementHighlight", () => {
  it("should resolve a registered item id to its element", () => {
    // Arrange
    const element = document.createElement("div");
    element.scrollIntoView = vi.fn();

    // Act
    const sink = renderProbe({
      open: true,
      itemId: "step-1",
      registerAs: "step-1",
      element,
    });

    // Assert
    expect(sink.current).toBe(element);
  });

  it("should scroll the resolved element into view", () => {
    // Arrange
    const element = document.createElement("div");
    const scrollIntoView = vi.fn();
    element.scrollIntoView = scrollIntoView;

    // Act
    renderProbe({
      open: true,
      itemId: "step-1",
      registerAs: "step-1",
      element,
    });

    // Assert
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });

  it("should resolve to null for an id nothing registered", () => {
    // Arrange
    const element = document.createElement("div");
    element.scrollIntoView = vi.fn();

    // Act
    const sink = renderProbe({
      open: true,
      itemId: "step-missing",
      registerAs: "step-1",
      element,
    });

    // Assert
    expect(sink.current).toBeNull();
  });

  it("should resolve to null while closed even for a registered id", () => {
    // Arrange
    const element = document.createElement("div");
    element.scrollIntoView = vi.fn();

    // Act
    const sink = renderProbe({
      open: false,
      itemId: "step-1",
      registerAs: "step-1",
      element,
    });

    // Assert
    expect(sink.current).toBeNull();
  });

  it("should resolve to null when no item id is supplied", () => {
    // Arrange
    const element = document.createElement("div");
    element.scrollIntoView = vi.fn();

    // Act
    const sink = renderProbe({
      open: true,
      itemId: null,
      registerAs: "step-1",
      element,
    });

    // Assert
    expect(sink.current).toBeNull();
  });
});
