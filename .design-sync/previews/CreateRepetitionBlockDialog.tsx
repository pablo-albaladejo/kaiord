import { useEffect, useRef } from "react";

import * as S from "@ds-stories/packages/workout-spa-editor/src/components/molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog.stories";
import { CreateRepetitionBlockDialog } from "../../packages/workout-spa-editor/src/components/molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog";

// The dialog renders `fixed inset-0` in place (no portal). The card harness
// wraps each story in a zero-height `transform: translateZ(0)` box that becomes
// that overlay's containing block, so it collapses above y=0. The
// viewport-height frame restores the containing block the real app has.
//
// FilledHighCount / ValidationError set their state in a story `play`
// function, which the harness ignores; `replay` re-types into the real input.
type Props = React.ComponentProps<typeof CreateRepetitionBlockDialog>;

const setNativeValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

/** Poll once per frame (bounded) until the input mounts, then run `act`. */
const whenInputReady = (
  root: HTMLElement,
  act: (input: HTMLInputElement, root: HTMLElement) => void
) => {
  let frames = 0;
  const tick = () => {
    const input = root.querySelector<HTMLInputElement>('input[type="number"]');
    if (input) return act(input, root);
    if (frames++ < 120) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const Frame = ({
  args,
  replay,
}: {
  args: Partial<Props> | undefined;
  replay?: (input: HTMLInputElement, root: HTMLElement) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && replay) whenInputReady(ref.current, replay);
  }, [replay]);
  return (
    <div ref={ref} style={{ height: "100vh" }}>
      <CreateRepetitionBlockDialog {...(args as Props)} />
    </div>
  );
};

const typeHighCount = (input: HTMLInputElement) => setNativeValue(input, "10");

const typeInvalidAndSubmit = (input: HTMLInputElement, root: HTMLElement) => {
  setNativeValue(input, "0");
  requestAnimationFrame(() => {
    const create = Array.from(root.querySelectorAll("button")).find((b) =>
      /create/i.test(b.textContent ?? "")
    );
    create?.focus();
    create?.click();
  });
};

export const Default = () => <Frame args={S.Default.args} />;
export const WithoutStepCount = () => <Frame args={S.WithoutStepCount.args} />;
export const FilledHighCount = () => (
  <Frame args={S.FilledHighCount.args} replay={typeHighCount} />
);
export const ValidationError = () => (
  <Frame args={S.ValidationError.args} replay={typeInvalidAndSubmit} />
);
