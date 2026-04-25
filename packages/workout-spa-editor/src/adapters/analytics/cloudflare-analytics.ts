import type { Analytics, AnalyticsEvent } from "@kaiord/core";
import { createNoopAnalytics } from "@kaiord/core";

import type { CfBeacon } from "../../types/cf-beacon";

type WindowWithBeacon = Window & typeof globalThis & { cfBeacon?: CfBeacon };

export const createCloudflareAnalytics = (
  token: string | undefined
): Analytics => {
  if (!token) return createNoopAnalytics();

  const push = (name: string, props?: AnalyticsEvent) => {
    const win =
      typeof window !== "undefined" ? (window as WindowWithBeacon) : undefined;
    if (win?.cfBeacon) {
      try {
        win.cfBeacon.pushEvent(name, props);
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
