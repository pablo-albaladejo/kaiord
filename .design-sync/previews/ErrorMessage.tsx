import * as React from "react";
import * as S from "@ds-stories/packages/workout-spa-editor/src/components/atoms/ErrorMessage/ErrorMessage.stories";

function compose(S: any, key: string) {
  const meta: any = S.default ?? {};
  const st: any = S[key];
  const args: any = { ...(meta.args ?? {}), ...(st && st.args ? st.args : {}) };
  // Storybook resolves argTypes.mapping (control value -> real arg) before
  // rendering; mirror that so mapped args don't render raw.
  const at: any = {
    ...(meta.argTypes ?? {}),
    ...(st && st.argTypes ? st.argTypes : {}),
  };
  for (const k of Object.keys(args)) {
    const m = at[k] && at[k].mapping;
    if (m && typeof m === "object" && args[k] in m) args[k] = m[args[k]];
  }
  // Storybook's actions addon turns `argTypes.<prop>.action` into an IMPLICIT
  // arg: every story of the meta receives a spy handler even when its own
  // `args` never mention it. ErrorMessage declares onRetry/onDismiss that way,
  // so the reference renders both buttons on every story; mirror it here.
  for (const k of Object.keys(at)) {
    if (at[k] && at[k].action !== undefined && args[k] === undefined) {
      args[k] = () => undefined;
    }
  }
  const title: string = typeof meta.title === "string" ? meta.title : "";
  const ctx: any = {
    args,
    name: key,
    title,
    kind: title,
    id: "",
    componentId: "",
    globals: {},
    viewMode: "story",
    parameters: (st && st.parameters) ?? meta.parameters ?? {},
  };
  let render: (() => any) | null = null;
  if (st && typeof st.render === "function")
    render = () => st.render(args, ctx);
  else if (typeof st === "function") render = () => st(args, ctx);
  else if (typeof meta.render === "function")
    render = () => meta.render(args, ctx);
  else {
    const C = (st && st.component) || meta.component;
    if (C) render = () => React.createElement(C, args);
  }
  if (!render) return () => null;
  // [].concat: a single function is legal CSF decorator shorthand. A
  // decorator returning undefined (stubbed addon) falls through to the inner
  // render — otherwise one unrecognized addon blanks the cell silently.
  const decorators: any[] = ([] as any[])
    .concat((st && st.decorators) ?? [])
    .concat(meta.decorators ?? []);
  return decorators.reduce(
    (inner: any, dec: any) => () => {
      const out = dec(inner, ctx);
      return out === undefined ? inner() : out;
    },
    render
  );
}

export const Default = /* Default */ compose(S, "Default");
export const WithMessage = /* With Message */ compose(S, "WithMessage");
export const WithValidationErrors = /* With Validation Errors */ compose(
  S,
  "WithValidationErrors"
);
export const WithRetry = /* With Retry */ compose(S, "WithRetry");
export const WithDismiss = /* With Dismiss */ compose(S, "WithDismiss");
export const WithBothActions = /* With Both Actions */ compose(
  S,
  "WithBothActions"
);
export const ComplexError = /* Complex Error */ compose(S, "ComplexError");
export const CustomStyling = /* Custom Styling */ compose(S, "CustomStyling");
