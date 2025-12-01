/**
 * ProfileFormFields Component
 *
 * Input fields for profile form.
 */

import { Input } from "../../../atoms/Input/Input";

type ProfileFormData = {
  name: string;
  bodyWeight?: number;
  ftp?: number;
  maxHeartRate?: number;
};

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
      <div className="grid grid-cols-3 gap-3">
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
        <Input
          label="FTP (watts)"
          type="number"
          value={formData.ftp?.toString() ?? ""}
          onChange={(e) =>
            onFormDataChange({
              ...formData,
              ftp: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="250"
        />
        <Input
          label="Max HR (bpm)"
          type="number"
          value={formData.maxHeartRate?.toString() ?? ""}
          onChange={(e) =>
            onFormDataChange({
              ...formData,
              maxHeartRate: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="190"
        />
      </div>
    </>
  );
}
