/**
 * useProfileByIdLive — reactive read hook for a single profile.
 *
 * Binds to the production Dexie singleton `db` (D1.3). Re-fires on
 * any mutation to the `profiles` table (Dexie liveQuery does not
 * observe at row granularity for `.get()` queries — it subscribes
 * to the entire table). Acceptable for this codebase: profiles are
 * few, mutations rare, and consumers gating expensive derivations
 * are expected to `useMemo` keyed on stable scalar fields per design
 * D1.
 *
 * Returns `undefined` while loading on first mount or when the id
 * is missing; consumers SHALL distinguish loading (`undefined`) from
 * the deleted-or-unknown profile case after data resolves.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import type { Profile } from "../types/profile";

export const useProfileByIdLive = (
  id: string | null | undefined
): Profile | undefined =>
  useLiveQuery<Profile | undefined>(
    () =>
      id ? db.table<Profile>("profiles").get(id) : Promise.resolve(undefined),
    [id]
  );
