import { useTranslate } from "../../../i18n/use-translate";
import type { ConflictDecision } from "../../../types/coaching-zones";

export type ConflictGroupRadiosProps = {
  groupKey: string;
  decision: ConflictDecision;
  onChange: (next: ConflictDecision) => void;
};

export const ConflictGroupRadios = ({
  groupKey,
  decision,
  onChange,
}: ConflictGroupRadiosProps) => {
  const t = useTranslate("zones");
  return (
    <div className="mt-2 flex gap-3 text-xs">
      <label className="flex items-center gap-1">
        <input
          type="radio"
          name={`zones-conflict-${groupKey}`}
          value="accept"
          checked={decision === "accept"}
          onChange={() => onChange("accept")}
        />
        {t("conflict.accept")}
      </label>
      <label className="flex items-center gap-1">
        <input
          type="radio"
          name={`zones-conflict-${groupKey}`}
          value="reject"
          checked={decision === "reject"}
          onChange={() => onChange("reject")}
        />
        {t("conflict.keep")}
      </label>
    </div>
  );
};
