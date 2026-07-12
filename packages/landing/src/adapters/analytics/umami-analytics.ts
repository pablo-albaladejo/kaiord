import { createNoopAnalytics } from "@kaiord/core";
import type { Analytics } from "@kaiord/core";

export const createUmamiAnalytics = (
  websiteId: string | undefined
): Analytics => {
  if (!websiteId) return createNoopAnalytics();

  return {
    // The Umami tracker auto-tracks page views (it hooks the History API);
    // submitting one here as well would double-count every view.
    pageView: () => undefined,
    event: (name, props) => {
      if (typeof window === "undefined" || !window.umami) return;
      try {
        window.umami.track(name, props);
      } catch {
        // tracker errors must not surface to the application
      }
    },
  };
};
