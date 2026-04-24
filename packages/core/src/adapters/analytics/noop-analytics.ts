import type { Analytics } from "../../ports/analytics";

export const createNoopAnalytics = (): Analytics => ({
  pageView: () => {},
  event: () => {},
});
