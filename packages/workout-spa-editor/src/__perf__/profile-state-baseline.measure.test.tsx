/**
 * Profile-state perf baseline (Phase 1A → 1B gate).
 *
 * Captures render counts for two interactions whose observable
 * frequency is sensitive to the profile-state read path:
 *   - `LayoutHeader` re-renders during an active-profile-change
 *     interaction (Phase 1A migrated this site to `useActiveProfileLive`).
 *   - A minimal `useAiGeneration`-equivalent consumer re-renders during
 *     an AI-provider-change interaction (Phase 1A leaves this on the
 *     legacy `useAiStore` + `useProfileStore`).
 *
 * The first time this test runs (Phase 1A), the JSON sibling file is
 * written. Phase 1B's `1B.5.2` reads it, runs fresh measurements, and
 * fails loudly if `post / pre > 2` per metric. See `tasks.md`.
 *
 * The Profiler's `onRender` callback fires once per commit per profiler
 * boundary; a brief `await` after each Dexie write lets `useLiveQuery`'s
 * BroadcastChannel propagate before counting.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { act, render, waitFor } from "@testing-library/react";
import { Profiler, type ProfilerOnRenderCallback } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import { createProfile } from "../application/profile/create-profile";
import { setActiveProfile } from "../application/profile/set-active-profile";
import { useActiveProfileLive } from "../hooks/use-active-profile-live";
import { useAiStore } from "../store/ai-store";

const baselinePath = resolve(__dirname, "profile-state-baseline.json");

const clearProfileTables = () =>
  Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);

const ProfileNameProbe = () => {
  const profile = useActiveProfileLive()?.profile ?? null;
  return <span data-testid="probe">{profile?.name ?? "no-profile"}</span>;
};

const ProviderNameProbe = () => {
  // Minimal proxy for `useAiGeneration`'s provider-driven re-render path.
  // Reads the legacy `useAiStore` selectedProviderId so a write to that
  // store causes the same kind of subscriber re-render the real hook
  // experiences. The hook itself depends on too many contexts to mount
  // in a focused perf harness; this proxy isolates the observable cause.
  const id = useAiStore((s) => s.selectedProviderId);
  return <span data-testid="ai-probe">{id ?? "none"}</span>;
};

const Harness = ({
  onRender,
  children,
}: {
  onRender: ProfilerOnRenderCallback;
  children: React.ReactNode;
}) => (
  <Profiler id="probe" onRender={onRender}>
    {children}
  </Profiler>
);

const measureLayoutHeader = async (): Promise<number> => {
  const persistence = createDexiePersistence(db);
  const a = await createProfile(persistence, "Profile A");
  const b = await createProfile(persistence, "Profile B");

  let count = 0;
  const onRender: ProfilerOnRenderCallback = () => {
    count += 1;
  };

  const { findByTestId } = render(
    <Harness onRender={onRender}>
      <ProfileNameProbe />
    </Harness>
  );
  await findByTestId("probe");
  // Settle initial useLiveQuery resolution before counting transitions.
  await waitFor(async () => {
    const probe = await findByTestId("probe");
    expect(probe.textContent).toBe("Profile A");
  });
  const initialCount = count;

  await setActiveProfile(persistence, b.id);
  await waitFor(async () => {
    const probe = await findByTestId("probe");
    expect(probe.textContent).toBe("Profile B");
  });

  await setActiveProfile(persistence, a.id);
  await waitFor(async () => {
    const probe = await findByTestId("probe");
    expect(probe.textContent).toBe("Profile A");
  });

  return count - initialCount;
};

const measureUseAiGeneration = async (): Promise<number> => {
  let count = 0;
  const onRender: ProfilerOnRenderCallback = () => {
    count += 1;
  };

  const { findByTestId } = render(
    <Harness onRender={onRender}>
      <ProviderNameProbe />
    </Harness>
  );
  await findByTestId("ai-probe");
  const initialCount = count;

  // Two transitions: select provider A, then provider B. Wrap in act()
  // so React commits before the next assertion observes the count.
  act(() => {
    useAiStore.setState({ selectedProviderId: "provider-a" });
  });
  await waitFor(async () => {
    const probe = await findByTestId("ai-probe");
    expect(probe.textContent).toBe("provider-a");
  });

  act(() => {
    useAiStore.setState({ selectedProviderId: "provider-b" });
  });
  await waitFor(async () => {
    const probe = await findByTestId("ai-probe");
    expect(probe.textContent).toBe("provider-b");
  });

  return count - initialCount;
};

describe("profile-state perf baseline", () => {
  beforeEach(async () => {
    await clearProfileTables();
    useAiStore.setState({ selectedProviderId: null });
  });
  afterEach(async () => {
    await clearProfileTables();
  });

  it("captures LayoutHeader and useAiGeneration baseline counts", async () => {
    const layoutHeader = await measureLayoutHeader();
    const useAiGeneration = await measureUseAiGeneration();

    expect(layoutHeader).toBeGreaterThan(0);
    expect(useAiGeneration).toBeGreaterThan(0);

    const payload = {
      layoutHeader,
      useAiGeneration,
      capturedAt: new Date().toISOString().slice(0, 10),
      capturedAgainstSha:
        process.env.GIT_SHA ?? "feature/persistence-rule-cleanup-1a",
      methodology:
        "React Profiler onRender count over (a) two setActiveProfile transitions on a 2-profile dataset for LayoutHeader's live-hook probe, (b) two useAiStore.selectedProviderId transitions for the AI provider-change proxy. Counts exclude the initial mount commit.",
    };

    writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`);
  });
});
