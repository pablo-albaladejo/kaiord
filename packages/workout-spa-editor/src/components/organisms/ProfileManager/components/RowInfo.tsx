/** Static label + connection summary cell for `LinkedAccountRow`. */
import { useTranslate } from "../../../../i18n/use-translate";
import type { LinkedCoachingAccount } from "../../../../types/coaching-account";

export const RowInfo = ({
  label,
  linked,
}: {
  label: string;
  linked: LinkedCoachingAccount | undefined;
}) => {
  const t = useTranslate("athlete");
  return (
    <div className="text-sm">
      <div className="font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">
        {linked ? (
          <>
            {t("profileManager.connectedAs")}{" "}
            <strong>{linked.externalUserName}</strong>
          </>
        ) : (
          t("profileManager.notConnected")
        )}
      </div>
    </div>
  );
};
