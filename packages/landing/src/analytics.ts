import { createUmamiAnalytics } from "./adapters/analytics/umami-analytics";

export const analytics = createUmamiAnalytics(
  import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined
);
