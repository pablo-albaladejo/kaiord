import type { ReactNode } from "react";

import { ChatFab } from "../../packages/workout-spa-editor/src/components/molecules/ChatFab/ChatFab";

// ChatFab is `position: fixed`; the card harness wraps each story in a
// `translateZ(0)` box that becomes its containing block. Without a
// viewport-tall wrapper that box has ~0 height and the FAB lands above y=0.
// The route comes from the bundle's own DesignSystemProviders (read off the
// global: importing wouter would bring a second copy the component never reads).
type Providers = (props: { path: string; children: ReactNode }) => ReactNode;
const Providers: Providers = (props) => {
  const { DesignSystemProviders } = (
    window as unknown as { KaiordDesignSystem: { DesignSystemProviders: Providers } }
  ).KaiordDesignSystem;
  return <DesignSystemProviders {...props} />;
};

export const Visible = () => (
  <div style={{ height: "100vh" }}>
    <Providers path="/calendar">
      <ChatFab />
    </Providers>
  </div>
);
