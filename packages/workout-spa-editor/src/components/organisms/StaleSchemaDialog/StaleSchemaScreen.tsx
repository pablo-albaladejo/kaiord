import { useCallback, useEffect, useRef, useState } from "react";

import { reloadIntoNewerCode } from "../../../lib/stale-schema-reload";
import { StaleSchemaDialog } from "./StaleSchemaDialog";

type Phase = "idle" | "updating" | "try-again";

export type StaleSchemaScreenProps = {
  /** Boot tries the newer worker on its own; mid-session waits for a click. */
  autoUpdate: boolean;
  hasDraft: boolean;
  onDownloadDraft: () => void;
};

export const StaleSchemaScreen = ({
  autoUpdate,
  hasDraft,
  onDownloadDraft,
}: StaleSchemaScreenProps) => {
  const [phase, setPhase] = useState<Phase>(autoUpdate ? "updating" : "idle");
  const started = useRef(false);

  const attempt = useCallback(async (auto: boolean) => {
    setPhase("updating");
    const outcome = await reloadIntoNewerCode({ auto });
    if (outcome === "reloading") return;
    setPhase(outcome === "try-again" ? "try-again" : "idle");
  }, []);

  useEffect(() => {
    // Once per mount, StrictMode's second effect run included.
    if (!autoUpdate || started.current) return;
    started.current = true;
    void attempt(true);
  }, [autoUpdate, attempt]);

  return (
    <StaleSchemaDialog
      hasDraft={hasDraft}
      tryAgainLater={phase === "try-again"}
      reloading={phase === "updating"}
      onDownloadDraft={onDownloadDraft}
      onReload={() => void attempt(false)}
    />
  );
};
