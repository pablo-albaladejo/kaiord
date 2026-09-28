import type { Analytics, AnalyticsEvent } from "@kaiord/core";
import { createNoopAnalytics } from "@kaiord/core";

import {
  redactAnalyticsPath,
  scrubEventProps,
} from "../../lib/analytics-redaction";
import type { UmamiTracker } from "../../types/umami";

type WindowWithUmami = Window & typeof globalThis & { umami?: UmamiTracker };

const withTracker = (fn: (tracker: UmamiTracker) => void) => {
  const win =
    typeof window !== "undefined" ? (window as WindowWithUmami) : undefined;
  if (!win?.umami) return;
  try {
    fn(win.umami);
  } catch {
    // tracker errors must not surface to the application
  }
};

export const createUmamiAnalytics = (
  websiteId: string | undefined
): Analytics => {
  if (!websiteId) return createNoopAnalytics();

  return {
    // index.html loads the tracker with data-auto-track="false", so page
    // views are submitted manually with the wouter path as the URL — with
    // record ids replaced by their route pattern.
    pageView: (path) =>
      withTracker((tracker) =>
        tracker.track((props) => ({ ...props, url: redactAnalyticsPath(path) }))
      ),
    event: (name: string, props?: AnalyticsEvent) =>
      withTracker((tracker) => tracker.track(name, scrubEventProps(props))),
  };
};
