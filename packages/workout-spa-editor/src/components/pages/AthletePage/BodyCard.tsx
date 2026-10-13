import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { Card } from "../../atoms/Card";
import { Input } from "../../atoms/Input/Input";
import { SectionHead } from "../../molecules/SectionHead";
import { PhysiologyFields } from "../../organisms/ProfileManager/components/PhysiologyFields";
import { BODY_SECTION_ATTRS, BODY_SECTION_ID } from "./body-section";
import { MaxHeartRateField } from "./MaxHeartRateField";
import { useBodyForm } from "./use-body-form";

type BodyCardProps = {
  profileId: string;
  profile: Profile;
};

/**
 * Inline editor for the personal data the modal's "Personal Data" tab holds,
 * plus the cross-sport max heart rate. Autosaves like the modal, but says so.
 */
export function BodyCard({ profileId, profile }: BodyCardProps) {
  const t = useTranslate("athlete");
  const { form, saved, save, handleForm, commit, handleKeyDown } = useBodyForm(
    profileId,
    profile
  );

  return (
    <section id={BODY_SECTION_ID} {...BODY_SECTION_ATTRS} tabIndex={-1}>
      <SectionHead title={t("body.title")} />
      <Card className="p-4">
        <div
          className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2"
          onBlur={commit}
          onKeyDown={handleKeyDown}
        >
          <Input
            label={t("profileManager.personal.bodyWeight")}
            variant="number"
            value={form.bodyWeight?.toString() ?? ""}
            onChange={(e) =>
              handleForm({
                ...form,
                bodyWeight: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="70"
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
