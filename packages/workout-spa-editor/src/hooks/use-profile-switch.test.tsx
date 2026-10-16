/**
 * useProfileSwitch hook tests.
 *
 * Drives the switch-active-profile flow: matching profile in the
 * `profiles` array, missing profile (silent no-op), and persistence
 * rejection (toast surfacing). The 3000ms notification-clear timeout
 * is exercised under fake timers in a dedicated test.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeProfile } from "../application/profile/test-fixtures";
import { PersistenceProvider } from "../contexts/persistence-context";
import type { PersistencePort } from "../ports/persistence-port";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { Profile } from "../types/profile";
import { useProfileSwitch } from "./use-profile-switch";

const errorSpy = vi.fn();

vi.mock("../contexts/ToastContext", () => ({
  useToastContext: () => ({ error: errorSpy }),
}));

const wrap = (persistence: PersistencePort) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      {children}
    </PersistenceProvider>
  );
  return Wrapper;
};

const PROFILE_A: Profile = makeProfile({
  id: "00000000-0000-4000-8000-0000000000a1",
  name: "Alice",
});
const PROFILE_B: Profile = makeProfile({
  id: "00000000-0000-4000-8000-0000000000b2",
  name: "Bob",
});

describe("useProfileSwitch", () => {
  beforeEach(() => {
    errorSpy.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should set the active profile and post a switch notification on success", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(PROFILE_A);
    await persistence.profiles.put(PROFILE_B);
    const setSwitchNotification = vi.fn();
    const profiles: ReadonlyArray<Profile> = [PROFILE_A, PROFILE_B];

    const { result } = renderHook(
      () => useProfileSwitch({ profiles, onSwitched: setSwitchNotification }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => {
      result.current.handleSwitchProfile(PROFILE_B.id);
    });

    // Assert
    await waitFor(async () => {
      expect(await persistence.profiles.getActiveId()).toBe(PROFILE_B.id);
    });
    expect(setSwitchNotification).toHaveBeenCalledWith("Active athlete: Bob");
  });

  it("should switch without a callback and leave no timer behind", async () => {
    // Arrange
    vi.useFakeTimers();
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(PROFILE_A);
    const profiles: ReadonlyArray<Profile> = [PROFILE_A];
    const { result } = renderHook(() => useProfileSwitch({ profiles }), {
      wrapper: wrap(persistence),
    });

    // Act
    await act(async () => {
      result.current.handleSwitchProfile(PROFILE_A.id);
      await vi.advanceTimersByTimeAsync(0);
    });

    // Assert
    expect(await persistence.profiles.getActiveId()).toBe(PROFILE_A.id);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("should do nothing when the profile id is not present in the profiles array", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const setSwitchNotification = vi.fn();
    const setActiveSpy = vi.spyOn(persistence.profiles, "setActiveId");
    const profiles: ReadonlyArray<Profile> = [PROFILE_A];

    const { result } = renderHook(
      () => useProfileSwitch({ profiles, onSwitched: setSwitchNotification }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => {
      result.current.handleSwitchProfile("missing-id");
    });

    // Assert
    expect(setActiveSpy).not.toHaveBeenCalled();
    expect(setSwitchNotification).not.toHaveBeenCalled();
  });

  it("should surface a toast error when setActiveId rejects", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    persistence.profiles.setActiveId = vi.fn(() =>
      Promise.reject(new Error("simulated"))
    );
    const setSwitchNotification = vi.fn();
    const profiles: ReadonlyArray<Profile> = [PROFILE_A];

    const { result } = renderHook(
      () => useProfileSwitch({ profiles, onSwitched: setSwitchNotification }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => {
      result.current.handleSwitchProfile(PROFILE_A.id);
    });

    // Assert
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Couldn't switch athlete. Please try again."
      );
    });
    expect(setSwitchNotification).not.toHaveBeenCalled();
  });
});
