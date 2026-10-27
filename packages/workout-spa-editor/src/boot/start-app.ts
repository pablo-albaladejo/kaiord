import type { SchemaProbeResult } from "../adapters/dexie/schema-probe";
import { StaleSchemaError } from "../adapters/dexie/stale-schema-guard";

export type StartAppDeps = {
  probe: () => Promise<SchemaProbeResult>;
  openDb: () => Promise<unknown>;
  closeDb: () => void;
  renderApp: () => void;
  renderStale: () => Promise<void>;
};

const UNKNOWN: SchemaProbeResult = { status: "unknown" };

const probeOrUnknown = (deps: StartAppDeps): Promise<SchemaProbeResult> =>
  Promise.resolve()
    .then(deps.probe)
    .catch(() => UNKNOWN);

const release = (result: SchemaProbeResult): void => {
  if (result.status !== "fresh") return;
  try {
    result.release();
  } catch {
    // A probe connection that fails to close is only a leaked handle.
  }
};

/** True when the stale screen took over; false sends boot to the app. */
const tookOverAsStale = (
  deps: StartAppDeps,
  result: SchemaProbeResult
): Promise<boolean> =>
  result.status === "stale"
    ? Promise.resolve()
        .then(deps.renderStale)
        .then(
          () => true,
          () => false
        )
    : Promise.resolve(false);

/**
 * Renders only after the installed schema is known, because the app opens
 * the database from effects and Dexie patches the schema before its ready
 * gate runs. Stale code renders the stale screen and never opens `db`. Every
 * other outcome, any failure included, renders the app: the ready gate in
 * `installStaleSchemaGuard` stays the backstop for what the probe missed.
 * A fresh probe holds its connection until Dexie's open settles, so another
 * tab's upgrade in between still reaches a connection that hears it.
 */
export async function startApp(deps: StartAppDeps): Promise<void> {
  const result = await probeOrUnknown(deps);
  if (await tookOverAsStale(deps, result)) return;
  deps.renderApp();
  await deps
    .openDb()
    .catch((error: unknown) => {
      // The guard already announced it; keep Dexie from auto-opening again.
      if (error instanceof StaleSchemaError) deps.closeDb();
    })
    .finally(() => release(result));
}
