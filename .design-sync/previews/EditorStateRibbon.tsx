import { EditorStateRibbon } from "@ds-stories/packages/workout-spa-editor/src/components/organisms/EditorStateRibbon/EditorStateRibbon";

/**
 * `EditorStateRibbon.stories.tsx` documents that `extensionInstalled` starts
 * `false` and nothing in a headless harness can make the real Chrome
 * extension announce itself, so `useGarminGate` always resolves to
 * `"no-extension"` here — the `export-disabled` / `no-session` / `ready`
 * copy is unreachable without faking that internal, which this preview does
 * not do. These are the two visually distinct outcomes that gate can
 * actually produce: a sendable state (copy prompts installing the bridge)
 * versus a non-sendable one (`pushed` renders nothing, by design).
 */
export const SendableWithNoBridgeInstalled = () => (
  <EditorStateRibbon state="structured" onSent={() => {}} />
);

export const AlreadyPushedRendersNothing = () => (
  <EditorStateRibbon state="pushed" onSent={() => {}} />
);
