/**
 * FocusRegistryContext (§7.1) contract:
 *   - registerItem(id, el) is idempotent (repeat calls with the same id+el
 *     are a no-op).
 *   - unregisterItem(id, el) only deletes when the stored element matches
 *     the caller's element — this is the StrictMode double-mount guard:
 *     the second mount registers a new element before the first mount's
 *     cleanup fires, and that stale cleanup must not evict the live
 *     registration.
 *   - The context `value` is reference-stable across re-renders that do
 *     not touch the registry, so consumers using `useContext` are not
 *     re-rendered on unrelated parent updates.
 */

import { render } from "@testing-library/react";
import { useContext, useEffect, useRef } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  FocusRegistryContext,
  FocusRegistryProvider,
  type FocusRegistryValue,
} from "./focus-registry-context";
import { asItemId } from "../store/providers/item-id";

const captureValue = (sink: { current: FocusRegistryValue | null }) => {
  const Probe = () => {
    sink.current = useContext(FocusRegistryContext);
    return null;
  };
  return <Probe />;
};

describe("FocusRegistryContext", () => {
  it("registerItem stores the element under its id", () => {
    // Arrange
    const sink = { current: null as FocusRegistryValue | null };
    render(<FocusRegistryProvider>{captureValue(sink)}</FocusRegistryProvider>);
    const id = asItemId("item-1");
    const el = document.createElement("div");

    // Act
    sink.current!.registerItem(id, el);

    // Assert
    expect(sink.current!.getItem(id)).toBe(el);
  });

  it("registerItem is idempotent for the same (id, el) pair", () => {
    // Arrange
    const sink = { current: null as FocusRegistryValue | null };
    render(<FocusRegistryProvider>{captureValue(sink)}</FocusRegistryProvider>);
    const id = asItemId("item-2");
    const el = document.createElement("div");

    // Act — register twice with the same pair.
    sink.current!.registerItem(id, el);
    sink.current!.registerItem(id, el);

    // Assert — still the same element, no crash, no duplicate entry.
    expect(sink.current!.getItem(id)).toBe(el);
  });

  it("registerItem with a new element for the same id replaces the entry", () => {
    // Arrange
    const sink = { current: null as FocusRegistryValue | null };
    render(<FocusRegistryProvider>{captureValue(sink)}</FocusRegistryProvider>);
    const id = asItemId("item-3");
    const first = document.createElement("div");
    const second = document.createElement("div");

    // Act — StrictMode's second mount registers a fresh element.
    sink.current!.registerItem(id, first);
    sink.current!.registerItem(id, second);

    // Assert — the live element wins.
    expect(sink.current!.getItem(id)).toBe(second);
  });

  it("unregisterItem deletes only when the stored element matches (StrictMode guard)", () => {
    // Arrange — simulate StrictMode double-mount order:
    //   first mount registers `first`
    //   second mount registers `second`        (replaces)
    //   first mount cleanup calls unregister(id, first)   (stale — MUST NOT evict)
    //   second mount cleanup calls unregister(id, second) (live — evicts)
    const sink = { current: null as FocusRegistryValue | null };
    render(<FocusRegistryProvider>{captureValue(sink)}</FocusRegistryProvider>);
    const id = asItemId("item-4");
    const first = document.createElement("div");
    const second = document.createElement("div");

    // Act
    sink.current!.registerItem(id, first);
    sink.current!.registerItem(id, second);
    sink.current!.unregisterItem(id, first); // stale cleanup from first mount

    // Assert — the live `second` is still registered because the stale
    // cleanup identity did not match.
    expect(sink.current!.getItem(id)).toBe(second);

    // Act — the live cleanup correctly evicts.
    sink.current!.unregisterItem(id, second);
    expect(sink.current!.getItem(id)).toBeUndefined();
  });

  it("value reference is stable across re-renders with no registry mutations", () => {
    // Arrange — a parent that re-renders on a state toggle. The context
    // value must be reference-equal across the toggle so a memoized
    // consumer does not re-render.
    const observedValues = new Set<FocusRegistryValue>();
    let triggerRerender = () => {};

    const Inner = () => {
      const value = useContext(FocusRegistryContext);
      observedValues.add(value);
      return null;
    };

    const ParentWithToggle = () => {
      const rerenderRef = useRef(0);
      rerenderRef.current += 1;
      return (
        <FocusRegistryProvider>
          <Inner />
        </FocusRegistryProvider>
      );
    };

    const Wrapper = () => {
      const [, setN] = require("react").useState(0) as [
        number,
        (u: (n: number) => number) => void,
      ];
      triggerRerender = () => setN((n) => n + 1);
      return <ParentWithToggle />;
    };

    render(<Wrapper />);

    // Act
    triggerRerender();
    triggerRerender();

    // Assert — every render saw the same context-value reference.
    expect(observedValues.size).toBe(1);
  });

  it("supports multiple ids independently", () => {
    // Arrange
    const sink = { current: null as FocusRegistryValue | null };
    render(<FocusRegistryProvider>{captureValue(sink)}</FocusRegistryProvider>);
    const a = asItemId("item-a");
    const b = asItemId("item-b");
    const elA = document.createElement("div");
    const elB = document.createElement("div");

    // Act
    sink.current!.registerItem(a, elA);
    sink.current!.registerItem(b, elB);

    // Assert
    expect(sink.current!.getItem(a)).toBe(elA);
    expect(sink.current!.getItem(b)).toBe(elB);

    // Act — evicting `a` does not touch `b`.
    sink.current!.unregisterItem(a, elA);
    expect(sink.current!.getItem(a)).toBeUndefined();
    expect(sink.current!.getItem(b)).toBe(elB);
  });

  it("integrates with a typical useEffect register/unregister pattern", () => {
    // Arrange — a component that mounts, registers on effect, unmounts.
    const sink = { current: null as FocusRegistryValue | null };

    const ItemCard = ({ id }: { id: string }) => {
      const value = useContext(FocusRegistryContext);
      const ref = useRef<HTMLDivElement | null>(null);
      useEffect(() => {
        const el = ref.current;
        if (!el) return;
        value.registerItem(asItemId(id), el);
        return () => {
          value.unregisterItem(asItemId(id), el);
        };
      }, [id, value]);
      return <div ref={ref} data-testid={id} />;
    };

    const registryFn = vi.fn();

    const App = ({ show }: { show: boolean }) => (
      <FocusRegistryProvider>
        {captureValue(sink)}
        {show ? <ItemCard id="card-1" /> : null}
        <button
          onClick={() => registryFn(sink.current!.getItem(asItemId("card-1")))}
        >
          probe
        </button>
      </FocusRegistryProvider>
    );

    const { rerender, unmount } = render(<App show />);

    // Assert — after mount, the card is registered.
    expect(sink.current!.getItem(asItemId("card-1"))).not.toBeUndefined();

    // Act — unmount the card.
    rerender(<App show={false} />);

    // Assert — cleanup removed it.
    expect(sink.current!.getItem(asItemId("card-1"))).toBeUndefined();

    unmount();
  });
});
