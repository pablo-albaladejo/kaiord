import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { Button } from "../../atoms/Button";

export type WorkoutDetailNotFoundProps = {
  onBack: () => void;
};

/** Empty state shown when no workout matches the route id. */
export function WorkoutDetailNotFound({ onBack }: WorkoutDetailNotFoundProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 bg-surface-deep p-4 text-center">
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="text-[18px] font-semibold text-slate-200"
      >
        Workout not found
      </h1>
      <Button variant="ghost" onClick={onBack}>
        Back to calendar
      </Button>
    </div>
  );
}
