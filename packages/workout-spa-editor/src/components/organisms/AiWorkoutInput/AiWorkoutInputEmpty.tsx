import { Button } from "../../atoms/Button";

type AiWorkoutInputEmptyProps = {
  onSettingsClick: () => void;
};

export const AiWorkoutInputEmpty = ({
  onSettingsClick,
}: AiWorkoutInputEmptyProps) => (
  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
    <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
      Configure an AI provider to generate workouts from text.
    </p>
    <Button size="sm" onClick={onSettingsClick}>
      Open Settings
    </Button>
  </div>
);
