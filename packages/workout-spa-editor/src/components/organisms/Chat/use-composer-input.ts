import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type ChatComposerHandle = {
  /** Adds a suggestion without discarding what the user typed, then focuses. */
  suggest: (text: string) => void;
};

/** The composer's text and focus: refocus once a reply settles, and let a
 * suggestion be added from outside through `ref`. */
export const useComposerInput = (
  disabled: boolean,
  initialText: string | undefined,
  ref: Ref<ChatComposerHandle> | undefined
) => {
  const [text, setText] = useState(initialText ?? "");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wasDisabled = useRef(disabled);

  // A disabled control drops focus; hand it back once the reply settles.
  useEffect(() => {
    if (wasDisabled.current && !disabled) inputRef.current?.focus();
    wasDisabled.current = disabled;
  }, [disabled]);

  useImperativeHandle(ref, () => ({
    suggest: (suggestion) => {
      setText((prev) =>
        prev.trim() ? `${prev.trimEnd()}\n${suggestion}` : suggestion
      );
      inputRef.current?.focus();
    },
  }));

  return { text, setText, inputRef };
};
