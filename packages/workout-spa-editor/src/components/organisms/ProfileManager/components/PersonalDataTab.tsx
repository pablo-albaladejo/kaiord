/**
 * PersonalDataTab Component
 *
 * Tab content for the optional physiological inputs (height, birth date, sex,
 * resting HR, activity level) that feed basal-metabolic-rate estimation. The
 * weight is not here: the current weight is the latest weigh-in, edited in
 * the Athlete page's Body section.
 */

import type { ProfileFormData } from "../types";
import { PhysiologyFields } from "./PhysiologyFields";

type PersonalDataTabProps = {
  formData: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
};

export function PersonalDataTab({ formData, onChange }: PersonalDataTabProps) {
  return (
    <div className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
      <PhysiologyFields formData={formData} onChange={onChange} />
    </div>
  );
}
