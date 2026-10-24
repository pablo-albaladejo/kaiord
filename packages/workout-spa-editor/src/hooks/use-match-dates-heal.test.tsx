import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  PROFILE,
  seedSession,
  THU,
} from "../application/session-move.test-fixtures";
import { AnalyticsProvider } from "../contexts/analytics-context";
import { PersistenceProvider } from "../contexts/persistence-context";
import { useMatchDatesHeal } from "./use-match-dates-heal";

const render = async () => {
  const persistence = await seedSession({ workout: { date: THU } });
  const analytics = { event: vi.fn(), pageView: vi.fn() };
  const listByProfile = vi.spyOn(persistence.sessionMatch, "listByProfile");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AnalyticsProvider analytics={analytics}>
      <PersistenceProvider persistence={persistence}>
        {children}
      </PersistenceProvider>
    </AnalyticsProvider>
  );
  const hook = renderHook(
    ({ profileId }: { profileId: string | null }) =>
      useMatchDatesHeal(profileId),
    { wrapper, initialProps: { profileId: null as string | null } }
  );
  return { persistence, analytics, listByProfile, hook };
};

describe("useMatchDatesHeal", () => {
  it("should heal the active profile once it is known", async () => {
    // Arrange
    const { persistence, hook } = await render();

    // Act
    hook.rerender({ profileId: PROFILE });

    // Assert
    await waitFor(async () =>
      expect((await persistence.sessionMatch.getById("m"))?.date).toBe(THU)
    );
  });

  it("should heal a profile only once per session", async () => {
    // Arrange
    const { listByProfile, analytics, hook } = await render();
    hook.rerender({ profileId: PROFILE });
    await waitFor(() => expect(analytics.event).toHaveBeenCalled());

    // Act
    hook.rerender({ profileId: "p2" });
    hook.rerender({ profileId: PROFILE });

    // Assert
    await waitFor(() => expect(listByProfile).toHaveBeenCalledTimes(2));
    expect(listByProfile.mock.calls.map(([id]) => id)).toEqual([PROFILE, "p2"]);
  });
});
