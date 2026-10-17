import { useState } from "react";

import { isCapabilitiesRequest } from "../application/chat/is-capabilities-request";

export type UseChatCapabilities = {
  /** The on-demand catalog ("What can I do?") is open. */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Text a suggestion put in the composer, or null before any pick. */
  draft: string | null;
  /** Changes on every pick, so the composer remounts with the new draft. */
  composerKey: number;
  /** Fills the composer with a suggestion; never sends it. */
  fill: (text: string) => void;
  /** Sends to the model, except a "what can you do?" question, which opens
   * the local catalog instead. */
  send: (text: string) => void;
};

export function useChatCapabilities(
  sendToModel: (text: string) => void
): UseChatCapabilities {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState({ draft: null as string | null, key: 0 });
  return {
    open,
    setOpen,
    draft: pick.draft,
    composerKey: pick.key,
    fill: (text) => {
      setOpen(false);
      setPick((p) => ({ draft: text, key: p.key + 1 }));
    },
    send: (text) =>
      isCapabilitiesRequest(text) ? setOpen(true) : sendToModel(text),
  };
}
