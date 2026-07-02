import { useSearch } from "wouter";

/**
 * Reads the `?prefill=` search param that "adjust with AI" deep-links
 * attach to /chat, used to seed the composer input on mount.
 */
export const useChatPrefill = (): string | undefined => {
  const searchString = useSearch();
  return new URLSearchParams(searchString).get("prefill") ?? undefined;
};
