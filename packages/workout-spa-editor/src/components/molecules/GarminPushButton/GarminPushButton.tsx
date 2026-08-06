import { useLiveQuery } from "dexie-react-hooks";
import { Upload } from "lucide-react";
import { useParams } from "wouter";

import { db } from "../../../adapters/dexie/dexie-database";
import { useGarminBridge } from "../../../contexts";
import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { Button } from "../../atoms/Button";
import { PushFeedback } from "./PushFeedback";
import { useGarminPush } from "./useGarminPush";

/**
 * The editor's single send control.
 *
 * It no longer decides whether the watch is reachable — `useGarminGate` owns
 * that, and `EditorStateRibbon` only mounts this button once the chain is
 * intact. Returning `null` on a missing extension is what kept the most
 * common failure off the screen.
 */
export const GarminPushButton: React.FC<{ onSent?: () => void }> = ({
  onSent,
}) => {
  const t = useTranslate("common");
  const { pushing, setPushing } = useGarminBridge();
  const { id } = useParams<{ id?: string }>();
  const workout = useLiveQuery(
    () => (id ? db.table<WorkoutRecord>("workouts").get(id) : undefined),
    [id]
  );
  const { push } = useGarminPush(workout);
  const isLoading = pushing.status === "loading";

  const handleSend = async () => {
    if (await push()) onSent?.();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="cta"
        onClick={handleSend}
        loading={isLoading}
        disabled={isLoading}
        data-testid="send-to-garmin-button"
      >
        <Upload className="h-4 w-4" />
        {t("verbs.send")}
      </Button>
      <PushFeedback
        push={pushing}
        onReset={() => setPushing({ status: "idle" })}
      />
    </div>
  );
};
