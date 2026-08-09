import { useSyncExternalStore } from "react";
import type { BaseLocationHook } from "wouter";

// The route — path AND query — lives in the URL fragment, so the browser only
// ever requests the deploy prefix, a file that exists, and every route answers
// 200 on the first request. See `openspec/specs/spa-routing/spec.md`.
//
// Wouter ships `useHashLocation`, but it splits a route across two parts of
// the URL: the path goes in the fragment, the query in `location.search`. Its
// `navigate` writes the search only when the target restates one, so a query
// outlives the route that set it — open `/workout/new?date=2026-06-05`, leave
// for `/daily`, and the stale date arrives with you. Here the fragment carries
// the whole route, so navigating drops what it does not restate, exactly as
// the browser location does.

const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

const fragment = (): string => window.location.hash.replace(/^#/, "");

const withLeadingSlash = (path: string): string =>
  path.startsWith("/") ? path : `/${path}`;

export const fragmentPath = (): string => {
  const raw = fragment();
  const query = raw.indexOf("?");
  return withLeadingSlash(query === -1 ? raw : raw.slice(0, query));
};

export const fragmentSearch = (): string => {
  const raw = fragment();
  const query = raw.indexOf("?");
  return query === -1 ? "" : raw.slice(query);
};

type NavigateOptions = { replace?: boolean; state?: unknown };

export const navigateFragment = (
  to: string,
  { replace = false, state = null }: NavigateOptions = {}
): void => {
  const url = new URL(window.location.href);
  const oldURL = url.href;
  url.hash = withLeadingSlash(to);
  const newURL = url.href;

  // `pushState` does not fire `hashchange`, so subscribers are notified by
  // hand — the same contract wouter's own hash hook implements.
  window.history[replace ? "replaceState" : "pushState"](state, "", newURL);
  window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL }));
};

// Read by wouter's `useSearch`, which strips the leading `?` itself.
const useFragmentSearch = () =>
  useSyncExternalStore(subscribe, fragmentSearch, fragmentSearch);

export const useFragmentLocation: BaseLocationHook = () => [
  useSyncExternalStore(subscribe, fragmentPath, fragmentPath),
  navigateFragment,
];

useFragmentLocation.searchHook = useFragmentSearch;

// `<Link href="/calendar">` must render `#/calendar`: the anchor has to be a
// real, shareable URL, not a path the host would be asked to resolve.
useFragmentLocation.hrefs = (href: string) => `#${href}`;
