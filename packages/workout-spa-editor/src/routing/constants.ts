/**
 * Routing constants — shared between pages, the route announcer
 * hook, and the focus-on-route-change hook.
 *
 * Surface contract: every routed page renders a primary heading
 * marked with the route-heading attribute (NOT a specific element
 * tag) so the focus-on-route-change hook can locate it. The
 * attribute — not the heading level — is the contract.
 */

export const ROUTE_HEADING_ATTR = "data-route-heading" as const;

/** Selector form for the heading attribute (use in querySelector). */
export const ROUTE_HEADING_SELECTOR = `[${ROUTE_HEADING_ATTR}]` as const;

/** The athlete's external accounts: a top-level page, not a Settings section. */
export const CONNECTIONS_PATH = "/connections" as const;

/** Every athlete in this browser: create, rename, switch, import, export. */
export const ATHLETES_PATH = "/athletes" as const;

/** The active athlete: body, thresholds, zones. */
export const ATHLETE_PATH = "/athlete" as const;
