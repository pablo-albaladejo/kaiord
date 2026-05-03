/**
 * Smoke-render test through the REAL CoachingRegistryBootstrap.
 *
 * Mounts the dialog AND a TestProbe that calls useCoachingActivities
 * inside the same provider tree. The probe forces every registered
 * factory hook (today: useTrain2GoSource) to actually execute, so a
 * Rules-of-Hooks regression introduced INSIDE a factory body — not
 * just at the dialog boundary — is caught at `pnpm test`. Without the
 * probe, the post-fix dialog (which no longer consumes the registry)
 * would render cleanly even if a factory was structurally broken.
 *
 * Asserts:
 *   1. The dialog renders without throwing.
 *   2. The dialog's testid is present in document.body (Radix portal).
 *   3. The bootstrap registered ≥ 1 factory (non-vacuous registration).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CoachingRegistryBootstrap } from "../../../contexts/coaching-registry-bootstrap";
import { useCoachingSourceFactories } from "../../../contexts/coaching-registry-context";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { useCoachingActivities } from "../../../hooks/use-coaching-activities";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { CoachingActivityDialog } from "./CoachingActivityDialog";

vi.mock("wouter", () => ({
  useLocation: () => ["/calendar", vi.fn()],
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({
    id: "p1",
    profile: {
      id: "p1",
      name: "Pablo",
      sportZones: {},
      linkedAccounts: [],
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    },
  }),
}));

const baseActivity: CoachingActivity = {
  id: "train2go:12345",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-13",
  sport: { label: "Cycling", icon: "🚴" },
  title: "FTP test",
  duration: "01:00:00",
  effort: 4,
  status: "pending",
  description: "Warm up 10 min easy, then ramp.",
};

function TestProbe({
  onFactoryCount,
}: {
  onFactoryCount: (n: number) => void;
}) {
  const factories = useCoachingSourceFactories();
  // Force every factory hook to actually execute via the same code path
  // useCoachingActivities uses, so a Rules-of-Hooks regression inside any
  // factory body fails this test.
  useCoachingActivities(["2026-04-13"]);
  onFactoryCount(factories.length);
  return null;
}

describe("CoachingActivityDialog (bootstrap-real smoke)", () => {
  it("renders through CoachingRegistryBootstrap without throwing and registers ≥1 factory", () => {
    let factoryCount = -1;

    render(
      <PersistenceProvider persistence={createInMemoryPersistence()}>
        <ToastContextProvider>
          <CoachingRegistryBootstrap>
            <TestProbe onFactoryCount={(n) => (factoryCount = n)} />
            <CoachingActivityDialog
              activity={baseActivity}
              onClose={vi.fn()}
              expandActivity={vi.fn()}
            />
          </CoachingRegistryBootstrap>
        </ToastContextProvider>
      </PersistenceProvider>
    );

    expect(screen.getByTestId("coaching-activity-dialog")).toBeInTheDocument();
    // The probe ran the real factories; non-vacuous registration is the
    // safety net against an emptied bootstrap factory list.
    expect(factoryCount).toBeGreaterThanOrEqual(1);
  });
});
