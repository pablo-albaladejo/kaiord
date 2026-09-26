import type { ReactNode } from "react";

import { BottomNav } from "../../packages/workout-spa-editor/src/components/molecules/BottomNav/BottomNav";

// BottomNav's active tab follows the route, which its stories set through the
// global `parameters.route`. The card harness ignores story parameters, and a
// preview that brings its own wouter `Router` compiles a second copy of wouter
// that BottomNav never reads. So the route goes through the bundle's own
// `DesignSystemProviders`, read off the global rather than imported so no
// second copy is compiled in here either.
//
// The frame mirrors the stories' decorator: the transform makes it the
// containing block for the `fixed` nav, and the dark backdrop stands in for
// page content behind the glass.

type Providers = (props: { path: string; children: ReactNode }) => ReactNode;
const Providers: Providers = (props) => {
  const { DesignSystemProviders } = (window as any).KaiordDesignSystem;
  return <DesignSystemProviders {...props} />;
};

const onRoute = (path: string) => () => (
  <Providers path={path}>
    <div
      className="relative h-64 bg-slate-900"
      style={{ transform: "translateZ(0)" }}
    >
      <BottomNav />
    </div>
  </Providers>
);

export const DailyActive = onRoute("/daily");
export const CalendarActive = onRoute("/calendar");
export const LibraryActive = onRoute("/library");
export const NutritionActive = onRoute("/nutrition");
export const AthleteActive = onRoute("/athlete");
