/**
 * Profile-state perf gate.
 *
 * Re-runs the same two interaction measurements that produced the
 * committed baseline (`profile-state-baseline.json`):
 *
 *   - `LayoutHeader` re-renders during an active-profile-change
 *     interaction.
 *   - A minimal `useAiGeneration` proxy consumer re-renders during
 *     an AI-provider-change interaction.
 *
 * Two modes:
 *   - Default: regression gate. Reads the baseline JSON, runs fresh
 *     measurements, fails loudly if any post-1B render count exceeds
 *     `REGRESSION_FACTOR` × its baseline (or if the baseline file is
 *     missing).
 *   - `UPDATE_BASELINE=1`: regeneration. Writes the JSON with fresh
 *     numbers + `GIT_SHA` (when set) for provenance. Used during the
 *     initial capture in `1A.5.5` and whenever the methodology
 *     intentionally changes.
 *
 * The Profiler's `onRender` callback fires once per commit per
 * profiler boundary; a brief `await` after each Dexie write lets
 * `useLiveQuery`'s BroadcastChannel propagate before counting.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { act, render, waitFor } from "@testing-library/react";
import { Profiler, type ProfilerOnRenderCallback } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import { createProfile } from "../application/profile/create-profile";
import { setActiveProfile } from "../application/profile/set-active-profile";
import { useActiveProfileLive } from "../hooks/use-active-profile-live";
import { useAiRuntimeStore } from "../store/ai-runtime-store";

const baselinePath = resolve(__dirname, "profile-state-baseline.json");
const shouldUpdate = process.env.UPDATE_BASELINE === "1";
const REGRESSION_FACTOR = 2;
const ISO_DATE_LENGTH = 10;

type Baseline = {
  layoutHeader: number;
  useAiGeneration: number;
};

const clearProfileTables = () =>
  Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);

const ProfileNameProbe = () => {
  const profile = useActiveProfileLive()?.profile ?? null;
  return <span data-testid="probe">{profile?.name ?? "no-profile"}</span>;
};

const ProviderNameProbe = () => {
  // Minimal proxy for `useAiGeneration`'s provider-driven re-render
  // path. Subscribes to the runtime store's selectedProviderId so a
  // write to that store causes the same kind of subscriber re-render
  // the real hook experiences. The hook itself depends on too many
  // contexts to mount in a focused perf harness; this proxy isolates
  // the observable cause.
  const id = useAiRuntimeStore((s) => s.selectedProviderId);
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

  act(() => {
    useAiRuntimeStore.setState({ selectedProviderId: "provider-a" });
  });
  await waitFor(async () => {
    const probe = await findByTestId("ai-probe");
    expect(probe.textContent).toBe("provider-a");
  });

  act(() => {
    useAiRuntimeStore.setState({ selectedProviderId: "provider-b" });
  });
  await waitFor(async () => {
    const probe = await findByTestId("ai-probe");
    expect(probe.textContent).toBe("provider-b");
  });

  return count - initialCount;
};

const writeBaseline = (b: Baseline): void => {
  // Use the GIT_SHA env var (set in CI) when available; locally
  // `GIT_SHA=$(git rev-parse HEAD) UPDATE_BASELINE=1 pnpm test …`.
  const payload = {
    layoutHeader: b.layoutHeader,
    useAiGeneration: b.useAiGeneration,
    capturedAt: new Date().toISOString().slice(0, ISO_DATE_LENGTH),
    capturedAgainstSha:
      process.env.GIT_SHA ?? "unknown — run with GIT_SHA env var",
    methodology:
      "React Profiler onRender count over (a) two setActiveProfile transitions on a 2-profile dataset for LayoutHeader's live-hook probe, (b) two useAiRuntimeStore.selectedProviderId transitions for the AI provider-change proxy. Counts exclude the initial mount commit.",
  };
  writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`);
};

describe("profile-state perf gate", () => {
  beforeEach(async () => {
    await clearProfileTables();
    useAiRuntimeStore.setState({ selectedProviderId: null });
  });
  afterEach(async () => {
    await clearProfileTables();
  });

  it("should keep post-migration render counts within 2x of the committed baseline", async () => {
    // Arrange

    const layoutHeader = await measureLayoutHeader();

    // Act

    const useAiGeneration = await measureUseAiGeneration();

    // Assert

    expect(layoutHeader).toBeGreaterThan(0);
    expect(useAiGeneration).toBeGreaterThan(0);

    if (shouldUpdate) {
      writeBaseline({ layoutHeader, useAiGeneration });
      return;
    }

    // Mechanical dependency from `1A.5.5`: the baseline file MUST
    // exist before this test runs as a gate. Fail loudly if absent
    // so the regression check cannot be silently skipped.
    expect(
      existsSync(baselinePath),
      `profile-state baseline missing at ${baselinePath} — set UPDATE_BASELINE=1 to regenerate`
    ).toBe(true);
    const baseline = JSON.parse(readFileSync(baselinePath, "utf8")) as Baseline;
    expect(baseline.layoutHeader).toBeGreaterThan(0);
    expect(baseline.useAiGeneration).toBeGreaterThan(0);

    expect(
      layoutHeader,
      `LayoutHeader render count regressed: ${layoutHeader} > ${REGRESSION_FACTOR}x baseline (${baseline.layoutHeader})`
    ).toBeLessThanOrEqual(baseline.layoutHeader * REGRESSION_FACTOR);
    expect(
      useAiGeneration,
      `useAiGeneration render count regressed: ${useAiGeneration} > ${REGRESSION_FACTOR}x baseline (${baseline.useAiGeneration})`
    ).toBeLessThanOrEqual(baseline.useAiGeneration * REGRESSION_FACTOR);
  });
});
