import { Upload } from "lucide-react";

import { Button } from "../../atoms/Button";

/* Render-time gating used to hide the whole button when no export
   route existed, which was cosmetic — the push action itself was
   ungoverned. Now the same route check gates the action
   (executeWorkoutPush), so this shows the cause instead of vanishing. */
export function GarminExportDisabledButton() {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="secondary" disabled>
        <Upload className="h-4 w-4" />
        Garmin (export disabled)
      </Button>
    </div>
  );
}
