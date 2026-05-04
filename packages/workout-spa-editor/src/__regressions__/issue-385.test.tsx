/**
 * Issue #385 regression suite.
 *
 * Locks in the three reactive guarantees Phase 1B introduces:
 *
 *   1B.3.1 — `linkAccount` via PersistencePort propagates to consumers
 *            reading via `useActiveProfileLive`. Pre-1B the toast said
 *            "Linked Train2Go to Pablo" but the dialog stayed
 *            "Not connected" until refresh.
 *   1B.3.2 — Profiles + active id survive a refresh: a fresh mount
 *            against pre-populated Dexie shows both rows and marks the
 *            persisted active one. Pre-1B the Zustand store loaded
 *            empty on boot.
 *   1B.3.3 — `useActiveProfileLive` never exposes a `{ id: B,
 *            profile: ProfileA | null }` intermediate state during a
 *            same-tab transition triggered by a sibling component.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import { linkAccount } from "../application/coaching/link-account";
import { createProfile } from "../application/profile/create-profile";
import { setActiveProfile } from "../application/profile/set-active-profile";
import {
  type ActiveProfile,
  useActiveProfileLive,
} from "../hooks/use-active-profile-live";
import { useProfilesLive } from "../hooks/use-profiles-live";
import type { Profile } from "../types/profile";

const clearDexie = () =>
  Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);

const Train2GoLinkProbe = () => {
  const live = useActiveProfileLive();
  const profile = live?.profile ?? null;
  if (!profile) return <span data-testid="probe">Loading…</span>;
  const linked = profile.linkedAccounts.some((a) => a.source === "train2go");
  return (
    <span data-testid="probe">
      {linked ? `Sync ${profile.name}` : `Connect ${profile.name}`}
    </span>
  );
};

const ProfileListProbe = () => {
  const profiles = useProfilesLive();
  const active = useActiveProfileLive();
  if (profiles === undefined || active === undefined) {
    return <ul data-testid="profile-list" data-loading="true" />;
  }
  return (
    <ul data-testid="profile-list">
      {profiles.map((p) => (
        <li key={p.id} data-active={p.id === active.id ? "true" : "false"}>
          {p.name}
        </li>
      ))}
    </ul>
  );
};

const ActiveProfileProbe = ({ observed }: { observed: ActiveProfile[] }) => {
  const value = useActiveProfileLive();
  if (value !== undefined) observed.push(value);
  return <span data-testid="active">{value?.profile?.name ?? "none"}</span>;
};

const SwitcherButton = ({
  targetId,
  onClick,
}: {
  targetId: string;
  onClick: (id: string) => void;
}) => (
  <button data-testid="switch" onClick={() => onClick(targetId)}>
    switch
  </button>
);

describe("Issue #385 regressions", () => {
  beforeEach(clearDexie);
  afterEach(clearDexie);

  it("(1B.3.1) linkAccount via PersistencePort flips the Connect → Sync probe without remount", async () => {
    // Arrange

    const persistence = createDexiePersistence(db);
    const profile = await createProfile(persistence, "Pablo");

    // Act

    render(<Train2GoLinkProbe />);

    // Assert

    expect(await screen.findByText("Connect Pablo")).toBeInTheDocument();

    await linkAccount(persistence.profiles, profile.id, {
      source: "train2go",
      externalUserId: "28035",
      externalUserName: "Pablo",
      linkedAt: "2026-04-29T12:00:00.000Z",
    });

    await waitFor(() => {
      expect(screen.getByText("Sync Pablo")).toBeInTheDocument();
    });
  });

  it("(1B.3.2) profiles and the active id survive a refresh — fresh mount sees the persisted state", async () => {
    // Arrange

    const persistence = createDexiePersistence(db);
    const a = await createProfile(persistence, "Alpha");
    const b = await createProfile(persistence, "Beta");
    await setActiveProfile(persistence, b.id);

    // Act

    render(<ProfileListProbe />);

    // Assert

    await waitFor(() => {
      const list = screen.getByTestId("profile-list");
      expect(list).not.toHaveAttribute("data-loading");
      expect(list.querySelectorAll("li").length).toBe(2);
    });

    const items = screen.getByTestId("profile-list").querySelectorAll("li");
    const activeItems = Array.from(items).filter(
      (li) => li.getAttribute("data-active") === "true"
    );
    expect(activeItems).toHaveLength(1);
    expect(activeItems[0]?.textContent).toBe("Beta");
    // Sanity: both rows render — order is implementation-defined for
    // `db.table("profiles").toArray()`, so assert membership rather
    // than position.
    const labels = Array.from(items).map((li) => li.textContent);
    expect(labels).toContain("Alpha");
    expect(labels).toContain("Beta");
    expect(a.id).not.toBe(b.id);
  });

  it("(1B.3.3) sibling-driven setActiveProfile transition is observed atomically — never sees { id: B, profile: <other> }", async () => {
    // Arrange

    const persistence = createDexiePersistence(db);
    const a = await createProfile(persistence, "A");
    const b = await createProfile(persistence, "B");
    await setActiveProfile(persistence, a.id);

    const observed: ActiveProfile[] = [];

    // Act

    render(
      <>
        <ActiveProfileProbe observed={observed} />
        <SwitcherButton
          targetId={b.id}
          onClick={(id) => {
            void setActiveProfile(persistence, id);
          }}
        />
      </>
    );

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("active")).toHaveTextContent("A");
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId("switch"));

    await waitFor(() => {
      expect(screen.getByTestId("active")).toHaveTextContent("B");
    });

    // The atomic same-tab join (D1) means consumers must never see
    // { id: B, profile: A } or { id: B, profile: null } during the
    // transition. Verify across every recorded render.
    for (const snapshot of observed) {
      const inconsistent =
        snapshot.id === b.id && snapshot.profile?.id !== b.id;
      expect(inconsistent).toBe(false);
    }
    expect(a.id).not.toBe(b.id);
    // Compiler dummy use to keep b.id meaningful in the assertion above.
    const _ignore: Profile | null | undefined = observed.at(-1)?.profile;
    expect(_ignore?.id ?? null).toBe(b.id);
  });
});
