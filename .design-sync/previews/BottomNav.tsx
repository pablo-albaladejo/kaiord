import type { ReactNode } from "react";

import { BottomNav } from "../../packages/workout-spa-editor/src/components/molecules/BottomNav/BottomNav";

// BottomNav's active tab follows the route. Its stories set the route with a
// wouter `Router` decorator; compiled into this card, that decorator brings a
// second copy of wouter which BottomNav never reads, so all three cards showed
// the same tab. The route is set through the bundle's own
// `DesignSystemProviders` instead, read off the global rather than imported so
// no second copy is compiled in here either. The dark frame is the stories'
// own: the nav is glass over content and reads as nothing on white.

type Providers = (props: { path: string; children: ReactNode }) => ReactNode;
const Providers: Providers = (props) => {
  const { DesignSystemProviders } = (window as any).KaiordDesignSystem;
  return <DesignSystemProviders {...props} />;
};

const onRoute = (path: string) => () => (
  <Providers path={path}>
    <div className="relative h-64 bg-slate-900">
      <BottomNav />
    </div>
  </Providers>
);

export const TodayActive = onRoute("/calendar");
export const LibraryActive = onRoute("/library");
export const SettingsActive = onRoute("/settings");
