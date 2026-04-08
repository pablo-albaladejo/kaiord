import { Upload } from "lucide-react";

import { useGarminStore } from "../../../store/garmin-store";
import { Button } from "../../atoms/Button";
import { PushFeedback } from "./PushFeedback";
import { useGarminPush } from "./useGarminPush";

export const GarminPushButton: React.FC = () => {
  const { extensionInstalled, sessionActive, pushing, setPushing } =
    useGarminStore();
  const { push } = useGarminPush();
  const isLoading = pushing.status === "loading";

  if (!extensionInstalled) {
    return null;
  }

  if (!sessionActive) {
    return (
      <Button size="sm" variant="secondary" disabled>
        <Upload className="h-4 w-4" />
        Garmin (no session)
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={push}
        loading={isLoading}
        disabled={isLoading}
      >
        <Upload className="h-4 w-4" />
        Send to Garmin
      </Button>
      <PushFeedback
        push={pushing}
        onReset={() => setPushing({ status: "idle" })}
      />
    </div>
  );
};
