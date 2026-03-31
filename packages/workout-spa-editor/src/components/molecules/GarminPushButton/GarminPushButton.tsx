import { Upload } from "lucide-react";
import { PushFeedback } from "./PushFeedback";
import { useGarminPush } from "./useGarminPush";
import { useGarminStore } from "../../../store/garmin-store";
import { useSettingsDialogStore } from "../../../store/settings-dialog-store";
import { Button } from "../../atoms/Button";

export const GarminPushButton: React.FC = () => {
  const onSettingsClick = useSettingsDialogStore((s) => s.show);
  const {
    push: pushState,
    hasCredentials,
    lambdaUrl,
    setPush,
  } = useGarminStore();
  const { push } = useGarminPush();
  const isLoading = pushState.status === "loading";

  if (!hasCredentials() || !lambdaUrl) {
    return (
      <Button size="sm" variant="secondary" onClick={onSettingsClick}>
        <Upload className="h-4 w-4" />
        Configure Garmin
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
        Push to Garmin
      </Button>
      <PushFeedback
        push={pushState}
        onReset={() => setPush({ status: "idle" })}
        onSettingsClick={onSettingsClick}
      />
    </div>
  );
};
