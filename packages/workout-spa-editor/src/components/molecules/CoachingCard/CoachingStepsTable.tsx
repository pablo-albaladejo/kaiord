/**
 * The coach's steps table, as the coach wrote it: duration, zone label,
 * power (W) and heart rate (bpm), with a repeat block shown as an "N ×"
 * group over its steps. Shown whether or not a Workout was built. A table
 * that is missing, or that does not hold whole, shows nothing: the coach's
 * text stays and no partial table is ever shown.
 */
import { useTranslate } from "../../../i18n/use-translate";
import {
  type CoachingStepGroup,
  type CoachingStructuredStep,
  coachingStructuredStepsSchema,
} from "../../../types/coaching-structured-steps";

type T = ReturnType<typeof useTranslate>;

const SECONDS_PER_MINUTE = 60;

const durationLabel = (t: T, seconds: number): string => {
  if (seconds < SECONDS_PER_MINUTE)
    return t("steps.seconds", { value: seconds });
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = seconds % SECONDS_PER_MINUTE;
  const value = rest ? `${minutes}:${String(rest).padStart(2, "0")}` : minutes;
  return t("steps.minutes", { value });
};

const CELL = "py-0.5 pr-3 tabular-nums";

const StepRow = ({ step, t }: { step: CoachingStructuredStep; t: T }) => (
  <tr>
    <td className={CELL}>{durationLabel(t, step.durationSeconds)}</td>
    <td className={`${CELL} font-medium`}>{step.zone}</td>
    <td className={CELL}>{t("steps.watts", step.powerWatts)}</td>
    <td className={CELL}>{t("steps.bpm", step.heartRateBpm)}</td>
  </tr>
);

const Group = ({ group, t }: { group: CoachingStepGroup; t: T }) => (
  <tbody className={group.repeat > 1 ? "border-l-2 border-edge" : undefined}>
    {group.repeat > 1 ? (
      <tr data-testid="coaching-dialog-steps-repeat">
        <th colSpan={4} scope="rowgroup" className="pt-1 text-left font-medium">
          {t("steps.repeat", { value: group.repeat })}
        </th>
      </tr>
    ) : null}
    {group.steps.map((step, i) => (
      <StepRow key={i} step={step} t={t} />
    ))}
  </tbody>
);

export function CoachingStepsTable({
  steps,
}: {
  steps: CoachingStepGroup[] | undefined;
}) {
  const t = useTranslate("coaching");
  const read = coachingStructuredStepsSchema.safeParse(steps);
  if (!read.success) return null;
  return (
    <section className="border-t border-edge pt-3 text-xs">
      <h3 className="mb-1 text-sm font-semibold">{t("steps.title")}</h3>
      <table data-testid="coaching-dialog-steps" className="w-full">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className={CELL}>{t("steps.duration")}</th>
            <th className={CELL}>{t("steps.zone")}</th>
            <th className={CELL}>{t("steps.power")}</th>
            <th className={CELL}>{t("steps.heartRate")}</th>
          </tr>
        </thead>
        {read.data.map((group, i) => (
          <Group key={i} group={group} t={t} />
        ))}
      </table>
    </section>
  );
}
