import type { AnalyticsEvent } from "@kaiord/core";

import { scrubAnalyticsString } from "./scrub-analytics-string";

// Allowlist mirroring AppRoutes.tsx and HealthSubRouter. A path that
// matches none of these is reported as UNKNOWN_PATH: an unmatched path is
// arbitrary text (a typo, a pasted link, an email) and is never forwarded.
const STATIC_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/daily",
  "/today",
  "/calendar",
  "/athlete",
  "/nutrition",
  "/chat",
  "/library",
  "/workout/new",
  "/settings",
  "/settings/profile",
  "/health",
  "/health/sleep",
  "/health/weight",
  "/health/recovery",
  "/health/activity",
  "/health/labs",
]);

// Settings sections, including the retired ones SettingsPage redirects.
const SETTINGS_SECTIONS: ReadonlySet<string> = new Set([
  "ai",
  "sync",
  "connections",
  "usage",
  "privacy",
  "preferences",
  "data-hub",
  "extensions",
]);

// An ISO week (`2026-W32`) is kept: it names a calendar week, not a record,
// and the spa-routing e2e asserts it.
const ISO_WEEK = /^\d{4}-W\d{2}$/;

const DYNAMIC_ROUTES: ReadonlyArray<[RegExp, (segment: string) => string]> = [
  [
    /^\/calendar\/([^/]+)$/,
    (w) => (ISO_WEEK.test(w) ? `/calendar/${w}` : "/calendar/:weekId"),
  ],
  [
    /^\/settings\/([^/]+)$/,
    (s) => (SETTINGS_SECTIONS.has(s) ? `/settings/${s}` : "/settings/:section"),
  ],
  [/^\/workout\/view\/([^/]+)$/, () => "/workout/view/:id"],
  [/^\/workout\/([^/]+)$/, () => "/workout/:id"],
  [/^\/chat\/([^/]+)$/, () => "/chat/:conversationId"],
];

export const UNKNOWN_PATH = "/unknown";

export const redactAnalyticsPath = (path: string): string => {
  const bare = path.replace(/[?#][\s\S]*$/, "");
  const normalized =
    bare.length > 1 && bare.endsWith("/") ? bare.slice(0, -1) : bare;
  if (STATIC_PATHS.has(normalized)) return normalized;
  for (const [pattern, toPattern] of DYNAMIC_ROUTES) {
    const match = pattern.exec(normalized);
    if (match?.[1] !== undefined) return toPattern(match[1]);
  }
  return UNKNOWN_PATH;
};

// Keys that identify a person rather than describe an action are dropped,
// and every string value goes through the shared PII scrubber, so a call
// site that forgets cannot send a profile id, an email or a token.
const IDENTIFYING_KEYS: ReadonlySet<string> = new Set(["profileId"]);

export const scrubEventProps = (
  props: AnalyticsEvent | undefined
): AnalyticsEvent | undefined => {
  if (!props) return props;
  return Object.fromEntries(
    Object.entries(props)
      .filter(([key]) => !IDENTIFYING_KEYS.has(key))
      .map(([key, value]) => [
        key,
        typeof value === "string" ? scrubAnalyticsString(value) : value,
      ])
  );
};
