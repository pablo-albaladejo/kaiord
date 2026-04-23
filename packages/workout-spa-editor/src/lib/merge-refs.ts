/**
 * Merge multiple React refs (callback or object) into a single
 * callback ref. Useful when a component both `forwardRef`s to a
 * parent AND needs its own internal ref.
 */

import type { MutableRefObject, Ref } from "react";

export const mergeRefs =
  <T>(...refs: Array<Ref<T> | undefined>) =>
  (node: T | null): void => {
    refs.forEach((r) => {
      if (!r) return;
      if (typeof r === "function") {
        r(node);
        return;
      }
      (r as MutableRefObject<T | null>).current = node;
    });
  };
