import { useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";

/**
 * Reads the `?prefill=` search param that "adjust with AI" deep-links
 * attach to /chat, used to seed the composer input on mount. The param is
 * stripped from the URL once consumed so a refresh or revisit does not
 * re-seed the composer.
 *
 * The composer remounts per conversation, so the prefill belongs to the
 * conversation it opened and is spent once the user leaves it: neither
 * another thread nor a return trip is seeded again.
 */
export const useChatPrefill = (activeId: string | null): string | undefined => {
  const searchString = useSearch();
  const [path, navigate] = useLocation();
  const initial = useRef<string | null>(null);
  const stripped = useRef(false);
  const seededId = useRef<string | null>(null);
  const spent = useRef(false);
  if (initial.current === null) {
    initial.current = new URLSearchParams(searchString).get("prefill") ?? "";
  }
  useEffect(() => {
    if (!stripped.current && initial.current) {
      stripped.current = true;
      navigate(path, { replace: true });
    }
  }, [navigate, path]);
  if (activeId !== null && !spent.current) {
    seededId.current ??= activeId;
    spent.current = seededId.current !== activeId;
  }
  return spent.current ? undefined : initial.current || undefined;
};
