export type AnalyticsEvent = Record<string, string | number | boolean>;

export type Analytics = {
  pageView: (path: string) => void;
  event: (name: string, props?: AnalyticsEvent) => void;
};
