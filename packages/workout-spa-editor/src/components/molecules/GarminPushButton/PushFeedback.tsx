import type { GarminStore } from "../../../store/garmin-store";

type PushFeedbackProps = {
  push: GarminStore["pushing"];
  onReset: () => void;
};

export const PushFeedback: React.FC<PushFeedbackProps> = ({
  push,
  onReset,
}) => {
  if (push.status === "success") {
    return (
      <button
        type="button"
        className="text-xs text-green-600 dark:text-green-400"
        onClick={onReset}
      >
        Sent to Garmin
      </button>
    );
  }

  if (push.status === "error") {
    return (
      <span className="text-xs text-red-600 dark:text-red-400">
        {push.message}
      </span>
    );
  }

  return null;
};
