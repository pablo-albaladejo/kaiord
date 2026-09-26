import { useEffect } from "react";
import type { ComponentProps } from "react";

import * as S from "@ds-stories/packages/workout-spa-editor/src/components/organisms/ZoneEditor/ZoneEditor.stories";
import { ZoneEditor } from "../../packages/workout-spa-editor/src/components/organisms/ZoneEditor/ZoneEditor";

type Props = ComponentProps<typeof ZoneEditor>;

const argsOf = (story: { args?: Partial<Props> }): Props => ({
  onSave: () => undefined,
  onCancel: () => undefined,
  ...S.default.args,
  ...story.args,
} as Props);

function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Zone 1's max input: the first control labelled "Max %". */
function findZoneOneMax(): HTMLInputElement | null {
  const label = Array.from(document.querySelectorAll("label")).find((el) =>
    /max %/i.test(el.textContent ?? "")
  );
  const control = label?.control;
  return control instanceof HTMLInputElement ? control : null;
}

/** Poll per frame (bounded) until the rows have mounted, then act. */
function whenZonesReady(run: (input: HTMLInputElement) => void) {
  let frames = 0;
  const tick = () => {
    const input = findZoneOneMax();
    if (input) return run(input);
    if (frames++ < 120) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export const PowerZonesWithFtp = () => (
  <ZoneEditor {...argsOf(S.PowerZonesWithFtp)} />
);
export const PowerZonesWithoutFtp = () => (
  <ZoneEditor {...argsOf(S.PowerZonesWithoutFtp)} />
);
export const HeartRateZonesWithLthr = () => (
  <ZoneEditor {...argsOf(S.HeartRateZonesWithLthr)} />
);
export const HeartRateZonesWithoutLthr = () => (
  <ZoneEditor {...argsOf(S.HeartRateZonesWithoutLthr)} />
);

/** Story `play` clears zone 1's max, then types 0 — max below min. */
export const ValidationError = () => {
  useEffect(() => {
    whenZonesReady((input) => {
      input.focus();
      setNativeValue(input, "");
      setNativeValue(input, "0");
    });
  }, []);
  return <ZoneEditor {...argsOf(S.ValidationError)} />;
};
