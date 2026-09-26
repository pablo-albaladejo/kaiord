import * as React from 'react';
import * as S from "@ds-stories/packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockCard.stories";

function compose(S: any, key: string) {
  const meta: any = S.default ?? {};
  const st: any = S[key];
  const args: any = { ...(meta.args ?? {}), ...(st && st.args ? st.args : {}) };
  // Storybook resolves argTypes.mapping (control value -> real arg) before
  // rendering; mirror that so mapped args don't render raw.
  const at: any = { ...(meta.argTypes ?? {}), ...(st && st.argTypes ? st.argTypes : {}) };
  for (const k of Object.keys(args)) {
    const m = at[k] && at[k].mapping;
    if (m && typeof m === 'object' && args[k] in m) args[k] = m[args[k]];
  }
  // Storybook's actions addon turns `argTypes.<prop>.action` into an IMPLICIT
  // arg, so the reference gives every story a spy handler even when its own
  // `args` omit it. RepetitionBlockCard hides the delete button, the menu and
  // "Add Step" when the handlers are undefined, so without this the
  // Minimal / WithoutDelete / WithoutUngroup cards lose UI the reference shows.
  for (const k of Object.keys(at)) {
    if (at[k] && at[k].action !== undefined && args[k] === undefined) {
      args[k] = () => undefined;
    }
  }
  const title: string = typeof meta.title === 'string' ? meta.title : '';
  const ctx: any = {
    args, name: key, title, kind: title, id: '', componentId: '',
    globals: {}, viewMode: 'story',
    parameters: (st && st.parameters) ?? meta.parameters ?? {},
  };
  let render: (() => any) | null = null;
  if (st && typeof st.render === 'function') render = () => st.render(args, ctx);
  else if (typeof st === 'function') render = () => st(args, ctx);
  else if (typeof meta.render === 'function') render = () => meta.render(args, ctx);
  else {
    const C = (st && st.component) || meta.component;
    if (C) render = () => React.createElement(C, args);
  }
  if (!render) return () => null;
  // [].concat: a single function is legal CSF decorator shorthand. A
  // decorator returning undefined (stubbed addon) falls through to the inner
  // render — otherwise one unrecognized addon blanks the cell silently.
  const decorators: any[] = ([] as any[]).concat((st && st.decorators) ?? []).concat(meta.decorators ?? []);
  return decorators.reduce((inner: any, dec: any) => () => {
    const out = dec(inner, ctx);
    return out === undefined ? inner() : out;
  }, render);
}

export const Default = /* Default */ compose(S, "Default");
export const SingleStep = /* Single Step */ compose(S, "SingleStep");
export const Empty = /* Empty */ compose(S, "Empty");
export const WithSelectedStep = /* With Selected Step */ compose(S, "WithSelectedStep");
export const Dragging = /* Dragging */ compose(S, "Dragging");
export const HighRepeatCount = /* High Repeat Count */ compose(S, "HighRepeatCount");
export const WithoutDelete = /* Without Delete */ compose(S, "WithoutDelete");
export const WithoutUngroup = /* Without Ungroup */ compose(S, "WithoutUngroup");
export const Minimal = /* Minimal */ compose(S, "Minimal");
