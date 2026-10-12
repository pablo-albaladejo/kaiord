/**
 * Construction cost of `KaiordDatabase`, pruned registration vs the full
 * version history it replaced. Dexie re-parses every earlier version on each
 * `stores()` call, so the cost grows with the square of the declared versions.
 * The production `db` is built at module load, on the boot path. Run with
 * `pnpm --filter @kaiord/workout-spa-editor bench`. Not a pass/fail gate.
 */
import Dexie from "dexie";
import { it } from "vitest";

import {
  captureKaiordRegistrations,
  HISTORY_VERSIONS,
  registerFullHistory,
} from "../../test-utils/kaiord-schema-history";
import { KaiordDatabase } from "./dexie-database";

const upgrades = captureKaiordRegistrations();
const full = `full history (${HISTORY_VERSIONS.length} versions)`;
const pruned = `pruned KaiordDatabase (${upgrades.size} versions)`;

it("should measure KaiordDatabase construction, full history vs pruned", async ({
  bench,
}) => {
  await bench.compare(
    bench(full, () => {
      registerFullHistory(new Dexie("bench-full"), undefined, upgrades);
    }),
    bench(pruned, () => {
      new KaiordDatabase("bench-pruned");
    })
  );
});
