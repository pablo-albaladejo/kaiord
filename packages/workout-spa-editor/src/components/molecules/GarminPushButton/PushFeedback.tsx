import type { GarminStore } from "../../../store/garmin-store";

type PushFeedbackProps = {
  push: GarminStore["push"];
  onReset: () => void;
  onSettingsClick: () => void;
};

export const PushFeedback: React.FC<PushFeedbackProps> = ({
  push,
  onReset,
  onSettingsClick,
}) => {
  if (push.status === "success") {
    return (
      <a
        href={push.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 underline dark:text-blue-400"
        onClick={onReset}
      >
        Open in Garmin Connect
      </a>
    );
  }

  if (push.status === "error") {
    return (
      <span className="text-xs text-red-600 dark:text-red-400">
        {push.message}
        {push.message.toLowerCase().includes("authentication") && (
          <>
            {" — "}
            <button
              type="button"
              className="underline"
              onClick={onSettingsClick}
            >
              check credentials
            </button>
          </>
        )}
      </span>
    );
  }

  return null;
};
