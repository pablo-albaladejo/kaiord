import { useLocation } from "wouter";

import { Button } from "../../atoms/Button";

/* No active profile yet. Navigates to the existing Settings profile
   surface (which redirects to this page once a profile exists) where the
   ProfileManagerDialog lets the user create one. */
export function AthleteEmptyState() {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-[15px] text-slate-300">No athlete profile yet</p>
      <Button variant="primary" onClick={() => navigate("/settings/profile")}>
        Create profile
      </Button>
    </div>
  );
}
