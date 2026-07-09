import { useTranslate } from "../../../i18n/use-translate";

const SKELETON_ROWS = [0, 1, 2, 3];

/** Loading phase: spinner-style heading plus shimmering skeleton rows. */
export function CreateGeneratingPhase() {
  const t = useTranslate("create-workout");
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-[16px] font-semibold text-slate-200">
        {t("generating.title")}
      </p>
      <div className="flex flex-col gap-3">
        {SKELETON_ROWS.map((row) => (
          <div
            key={row}
            className="h-14 animate-pulse rounded-[14px] border border-slate-800 bg-surface-deep"
          />
        ))}
      </div>
    </div>
  );
}
