import { useCurrentWeightKg } from "../../../hooks/health/use-current-weight";
import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { Card } from "../../atoms/Card";
import { SectionHead } from "../../molecules/SectionHead";
import { PhysiologyFields } from "../../organisms/ProfileManager/components/PhysiologyFields";
import { BODY_SECTION_ATTRS, BODY_SECTION_ID } from "./body-section";
import { CurrentWeightField } from "./CurrentWeightField";
import { MaxHeartRateField } from "./MaxHeartRateField";
import { useBodyForm } from "./use-body-form";

type BodyCardProps = {
  profileId: string;
  profile: Profile;
};

/**
 * Inline editor for the athlete's body: the current weight (an edit records
 * today's weigh-in), the physiology fields and the cross-sport max heart rate.
 * Autosaves, and says so.
 */
export function BodyCard({ profileId, profile }: BodyCardProps) {
  const t = useTranslate("athlete");
  const currentWeightKg = useCurrentWeightKg(profileId, profile);
  const { form, saved, save, recordWeight, handleForm, commit, handleKeyDown } =
    useBodyForm(profileId, profile);

  return (
    <section id={BODY_SECTION_ID} {...BODY_SECTION_ATTRS} tabIndex={-1}>
      <SectionHead title={t("body.title")} />
      <Card className="p-4">
        <div
          className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2"
          onBlur={commit}
          onKeyDown={handleKeyDown}
        >
          <CurrentWeightField
            currentKg={currentWeightKg}
            onSave={recordWeight}
          />
          <PhysiologyFields formData={form} onChange={handleForm} />
          <MaxHeartRateField
            initial={profile.maxHeartRate}
            onSave={(maxHeartRate) => save({ maxHeartRate })}
          />
        </div>
        <p role="status" className="m-0 mt-3 h-4 text-[13px] text-ink-muted">
          {saved ? t("body.saved") : ""}
        </p>
      </Card>
    </section>
  );
}
