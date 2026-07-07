import { Upload } from "lucide-react";

import type { PushState } from "../../../contexts";
import { Button } from "../../atoms/Button";
import { PushFeedback } from "./PushFeedback";

type Props = { pushing: PushState; onReset: () => void };

/* A failed push can invalidate the session (redetect on 401/403), which
   flips `sessionActive` to false right after `pushing` was set to
   "error". Still rendering `PushFeedback` here keeps that cause visible
   instead of it being replaced by this disabled button. */
export function GarminNoSessionButton({ pushing, onReset }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="secondary" disabled>
        <Upload className="h-4 w-4" />
        Garmin (no session)
      </Button>
      <PushFeedback push={pushing} onReset={onReset} />
    </div>
  );
}
