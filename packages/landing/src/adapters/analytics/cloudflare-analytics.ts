import { createNoopAnalytics } from "@kaiord/core";
import type { Analytics, AnalyticsEvent } from "@kaiord/core";

export const createCloudflareAnalytics = (
  token: string | undefined
): Analytics => {
  if (!token) return createNoopAnalytics();

  const push = (name: string, props?: AnalyticsEvent) => {
    if (typeof window !== "undefined" && window.cfBeacon) {
      try {
        window.cfBeacon.pushEvent(name, props);
      } catch {
        // beacon errors must not surface to the application
      }
    }
  };

  return {
    pageView: (path) => push("pageView", { path }),
    event: (name, props) => push(name, props),
  };
};
