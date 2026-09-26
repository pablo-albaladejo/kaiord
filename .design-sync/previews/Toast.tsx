import * as S from "@ds-stories/packages/workout-spa-editor/src/components/atoms/Toast/Toast.stories";
import { Toast } from "../../packages/workout-spa-editor/src/components/atoms/Toast/Toast";
import { ToastProvider } from "../../packages/workout-spa-editor/src/components/atoms/Toast/ToastProvider";

// Toast.stories.tsx wraps every story in a META-level `<ToastProvider>`
// decorator (Radix's Toast.Root only portals into a mounted Toast.Viewport).
// The design-system card harness mounts the compiled component from its args
// and ignores every story/meta decorator, so a generated card for Toast
// renders empty. This owned preview supplies the same Radix provider by hand.
//
// One export per story, named after it, so the comparer pairs each with its
// reference. `Stack` comes first and is the card's `primaryStory`: a real toast
// stack is never just one notification, so the card shows four real variants
// inside ONE shared provider. Args come straight from the stories so none of
// this can drift from the source of truth.

export const Stack = () => (
  <ToastProvider>
    <Toast {...S.Success.args} />
    <Toast {...S.Warning.args} />
    <Toast {...S.Error.args} />
    <Toast {...S.Info.args} />
  </ToastProvider>
);

export const Success = () => (
  <ToastProvider>
    <Toast {...S.Success.args} />
  </ToastProvider>
);

export const Warning = () => (
  <ToastProvider>
    <Toast {...S.Warning.args} />
  </ToastProvider>
);

export const Error = () => (
  <ToastProvider>
    <Toast {...S.Error.args} />
  </ToastProvider>
);

export const Info = () => (
  <ToastProvider>
    <Toast {...S.Info.args} />
  </ToastProvider>
);

export const WithAction = () => (
  <ToastProvider>
    <Toast {...S.WithAction.args} />
  </ToastProvider>
);
