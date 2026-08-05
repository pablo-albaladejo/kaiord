/**
 * The three conditions a week needs before it fills itself, in the order they
 * have to become true. Each carries its own destination; the copy — including
 * what stays broken while the step is not done — lives in `calendar.firstRun`.
 *
 * `href` is external for the bridge because a web page cannot install an
 * extension; the other two are in-app settings sections.
 */
export const BRIDGE_DOCS_URL = "https://kaiord.com/docs/bridges";

export type FirstRunStep = {
  /** Key under `calendar.firstRun.steps`. */
  key: "sources" | "aiKey" | "bridge";
  href: string;
  external?: boolean;
};

export const FIRST_RUN_STEPS: ReadonlyArray<FirstRunStep> = [
  { key: "sources", href: "/settings/connections" },
  { key: "aiKey", href: "/settings/ai" },
  { key: "bridge", href: BRIDGE_DOCS_URL, external: true },
];
