/** Static label + connection summary cell for `LinkedAccountRow`. */
import type { LinkedCoachingAccount } from "../../../../types/coaching-account";

export const RowInfo = ({
  label,
  linked,
}: {
  label: string;
  linked: LinkedCoachingAccount | undefined;
}) => (
  <div className="text-sm">
    <div className="font-medium">{label}</div>
    <div className="text-xs text-muted-foreground">
      {linked ? (
        <>
          Connected as <strong>{linked.externalUserName}</strong>
        </>
      ) : (
        "Not connected"
      )}
    </div>
  </div>
);
