import { useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";

/**
 * Reads the `?prefill=` search param that "adjust with AI" deep-links
 * attach to /chat, used to seed the composer input on mount. The param is
 * stripped from the URL once consumed so a refresh or revisit does not
 * re-seed the composer.
 */
export const useChatPrefill = (): string | undefined => {
  const searchString = useSearch();
  const [path, navigate] = useLocation();
  const initial = useRef<string | null>(null);
  const stripped = useRef(false);
  if (initial.current === null) {
    initial.current = new URLSearchParams(searchString).get("prefill") ?? "";
  }
  useEffect(() => {
    if (!stripped.current && initial.current) {
      stripped.current = true;
      navigate(path, { replace: true });
    }
  }, [navigate, path]);
  return initial.current || undefined;
};
