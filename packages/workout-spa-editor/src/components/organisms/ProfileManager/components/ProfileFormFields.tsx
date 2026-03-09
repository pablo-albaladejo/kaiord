/**
 * ProfileFormFields Component
 *
 * Input fields for profile form.
 */

import { Input } from "../../../atoms/Input/Input";
import type { ProfileFormData } from "../types";

type ProfileFormFieldsProps = {
  formData: ProfileFormData;
  onFormDataChange: (data: ProfileFormData) => void;
};

export function ProfileFormFields({
  formData,
  onFormDataChange,
}: ProfileFormFieldsProps) {
  return (
    <>
      <Input
        label="Name"
        value={formData.name}
        onChange={(e) =>
          onFormDataChange({ ...formData, name: e.target.value })
        }
        placeholder="Enter profile name"
        required
      />
      <Input
        label="Body Weight (kg)"
        type="number"
        value={formData.bodyWeight?.toString() ?? ""}
        onChange={(e) =>
          onFormDataChange({
            ...formData,
            bodyWeight: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        placeholder="70"
      />
    </>
  );
}
