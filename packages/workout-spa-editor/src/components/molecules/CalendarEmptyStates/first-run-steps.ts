/**
 * The three optional integrations, each with its own destination; the copy —
 * including what each one adds — lives in `calendar.firstRun`, except the
 * bridge step's Install, which is the Garmin Connection's own fix.
 *
 * `href` is external for the bridge because a web page cannot install an
 * extension; the other two are in-app settings sections.
 */
import { connectionFixHref } from "../../../application/connections/connection-fix-target";

/** Where the bridge step's Install goes: the same place as every Install. */
export const BRIDGE_DOCS_URL =
  connectionFixHref("install", "garmin-bridge") ?? "";

export type FirstRunStep = {
  /** Key under `calendar.firstRun.steps`. */
  key: "sources" | "aiKey" | "bridge";
  href: string;
  external?: boolean;
};

/** Which steps are already true for the active profile, read from live state. */
export type FirstRunProgress = Readonly<
  Partial<Record<FirstRunStep["key"], boolean>>
>;

export const FIRST_RUN_STEPS: ReadonlyArray<FirstRunStep> = [
  { key: "sources", href: "/connections" },
  { key: "aiKey", href: "/settings/ai" },
  { key: "bridge", href: BRIDGE_DOCS_URL, external: true },
];
