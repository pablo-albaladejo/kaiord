import { type RefObject, useRef, useState } from "react";

import { isCapabilitiesRequest } from "../application/chat/is-capabilities-request";
import type { ChatComposerHandle } from "../components/organisms/Chat/ChatComposer";

export type ChatCapabilitiesState = {
  /** The on-demand catalog ("What can I do?") is open. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Adds a suggestion to the composer; never sends it. */
  onPick: (text: string) => void;
};

export type UseChatCapabilities = {
  help: ChatCapabilitiesState;
  composerRef: RefObject<ChatComposerHandle | null>;
  /** Sends to the model, except a "what can you do?" question, which opens
   * the local catalog instead. */
  send: (text: string) => void;
};

export function useChatCapabilities(
  sendToModel: (text: string) => void,
  started: boolean
): UseChatCapabilities {
  const [open, setOpen] = useState(false);
  const composerRef = useRef<ChatComposerHandle>(null);
  return {
    help: {
      open,
      onOpenChange: setOpen,
      onPick: (text) => {
        setOpen(false);
        composerRef.current?.suggest(text);
      },
    },
    composerRef,
    send: (text) => {
      const local = isCapabilitiesRequest(text, { started });
      setOpen(local);
      if (!local) sendToModel(text);
    },
  };
}
