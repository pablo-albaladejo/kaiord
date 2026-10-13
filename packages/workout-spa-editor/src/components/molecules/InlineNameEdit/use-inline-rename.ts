import { useEffect, useRef, useState } from "react";

/**
 * Edit mode for an InlineNameEdit opened by a pencil button. Leaving the
 * field, saved or cancelled, hands the focus back to that pencil instead
 * of dropping it on the page body.
 */
export function useInlineRename() {
  const [renaming, setRenaming] = useState(false);
  const pencilRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    if (renaming || !returnFocus.current) return;
    returnFocus.current = false;
    pencilRef.current?.focus();
  }, [renaming]);

  return {
    renaming,
    pencilRef,
    start: () => setRenaming(true),
    done: () => {
      returnFocus.current = true;
      setRenaming(false);
    },
  };
}
