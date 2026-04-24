import type { Analytics } from "@kaiord/core";
import { createNoopAnalytics } from "@kaiord/core";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

const AnalyticsContext = createContext<Analytics>(createNoopAnalytics());

type AnalyticsProviderProps = Readonly<{
  analytics: Analytics;
  children: ReactNode;
}>;

export function AnalyticsProvider({
  analytics,
  children,
}: AnalyticsProviderProps) {
  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): Analytics {
  return useContext(AnalyticsContext);
}
