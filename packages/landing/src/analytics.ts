import { createCloudflareAnalytics } from "./adapters/analytics/cloudflare-analytics";

export const analytics = createCloudflareAnalytics(
  import.meta.env.VITE_CF_ANALYTICS_TOKEN as string | undefined
);
