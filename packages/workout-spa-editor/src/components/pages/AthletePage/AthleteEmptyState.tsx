import { Button } from "../../atoms/Button";

type AthleteEmptyStateProps = {
  onCreate: () => void;
};

/* No active profile yet. Opens the profile-creation surface in place
   (CreateProfileDialog, lifted into AthletePage) rather than navigating
   away — creating the first profile auto-activates it, swapping this page
   to the populated body. */
export function AthleteEmptyState({ onCreate }: AthleteEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-[15px] text-slate-300">No athlete profile yet</p>
      <Button variant="primary" onClick={onCreate}>
        Create profile
      </Button>
    </div>
  );
}
