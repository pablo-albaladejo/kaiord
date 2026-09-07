import * as S from "@ds-stories/packages/workout-spa-editor/src/components/atoms/Toast/Toast.stories";
import { Toast } from "../../packages/workout-spa-editor/src/components/atoms/Toast/Toast";
import { ToastProvider } from "../../packages/workout-spa-editor/src/components/atoms/Toast/ToastProvider";

// Toast.stories.tsx wraps every story in a META-level `<ToastProvider>`
// decorator (Radix's Toast.Root only portals into a mounted Toast.Viewport).
// The design-system card harness mounts the compiled component from its args
// and ignores every story/meta decorator, so a generated card for Toast
// renders empty. This owned preview supplies the same Radix provider by
// hand, and — since a real toast stack is never just one notification —
// stacks four real variants inside ONE shared provider instead of one lonely
// toast per card. Args come straight from the stories so this can never
// drift from the source of truth.

export const Default = () => (
  <ToastProvider>
    <Toast {...S.Success.args} />
    <Toast {...S.Warning.args} />
    <Toast {...S.Error.args} />
    <Toast {...S.Info.args} />
  </ToastProvider>
);
