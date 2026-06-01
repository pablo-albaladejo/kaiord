/**
 * Lazy GIS Script Loader
 *
 * Injects the Google Identity Services client library on demand (at
 * connect time), so the ~30 KB script never loads for users who do not
 * use cross-device sync. Idempotent: if `google.accounts` is already
 * present (or a load is in flight) it reuses the existing load.
 */

import type { GisGlobal } from "./gis-types";
import { GIS_SCRIPT_SRC } from "./google-oauth-config";

let inFlight: Promise<void> | null = null;

function gisReady(): boolean {
  return Boolean((window as unknown as GisGlobal).google?.accounts);
}

export function loadGisScript(): Promise<void> {
  if (gisReady()) return Promise.resolve();
  if (inFlight) return inFlight;

  inFlight = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      inFlight = null;
      resolve();
    };
    script.onerror = () => {
      inFlight = null;
      reject(new Error("Failed to load Google Identity Services script"));
    };
    document.head.appendChild(script);
  });
  return inFlight;
}
