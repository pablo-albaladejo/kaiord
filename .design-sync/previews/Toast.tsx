import type { ReactNode } from "react";

import * as S from "@ds-stories/packages/workout-spa-editor/src/components/atoms/Toast/Toast.stories";
import { Toast } from "../../packages/workout-spa-editor/src/components/atoms/Toast/Toast";
import { ToastProvider } from "../../packages/workout-spa-editor/src/components/atoms/Toast/ToastProvider";

// Toast.stories.tsx wraps every story in a META-level `<ToastProvider>`
// decorator (Radix's Toast.Root only portals into a mounted Toast.Viewport).
// The design-system card harness mounts the compiled component from its args
// and ignores every story/meta decorator, so a generated card for Toast
// renders empty. This owned preview supplies the same Radix provider by hand.
//
// The Radix viewport is `position: fixed`, and the card harness wraps each story
// in a zero-height `transform: translateZ(0)` box that becomes its containing
// block, so the toast would collapse above y=0. `ViewportFrame` gives that
// containing block the viewport's height, as in the real app.
//
// One export per story, named after it, so the comparer pairs each with its
// reference. `Stack` comes first and is the card's `primaryStory`: a real toast
// stack is never just one notification, so the card shows four real variants
// inside ONE shared provider. Args come straight from the stories so none of
// this can drift from the source of truth.

// Captures (?story=) keep the harness's 24px body padding while the product
// card is full-bleed. The frame starts at y=pad, so subtract the top padding
// once to land its bottom on the viewport bottom; the
// toast is edge-anchored and would otherwise sit below the fold in captures.
const ViewportFrame = ({ children }: { children: ReactNode }) => {
  const pad =
    Number.parseFloat(getComputedStyle(document.body).paddingTop) || 0;
  return <div style={{ height: `calc(100vh - ${pad}px)` }}>{children}</div>;
};

export const Stack = () => (
  <ViewportFrame>
    <ToastProvider>
      <Toast {...S.Success.args} />
      <Toast {...S.Warning.args} />
      <Toast {...S.Error.args} />
      <Toast {...S.Info.args} />
    </ToastProvider>
  </ViewportFrame>
);

export const Success = () => (
  <ViewportFrame>
    <ToastProvider>
      <Toast {...S.Success.args} />
    </ToastProvider>
  </ViewportFrame>
);

export const Warning = () => (
  <ViewportFrame>
    <ToastProvider>
      <Toast {...S.Warning.args} />
    </ToastProvider>
  </ViewportFrame>
);

export const Error = () => (
  <ViewportFrame>
    <ToastProvider>
      <Toast {...S.Error.args} />
    </ToastProvider>
  </ViewportFrame>
);

export const Info = () => (
  <ViewportFrame>
    <ToastProvider>
      <Toast {...S.Info.args} />
    </ToastProvider>
  </ViewportFrame>
);

export const WithAction = () => (
  <ViewportFrame>
    <ToastProvider>
      <Toast {...S.WithAction.args} />
    </ToastProvider>
  </ViewportFrame>
);
