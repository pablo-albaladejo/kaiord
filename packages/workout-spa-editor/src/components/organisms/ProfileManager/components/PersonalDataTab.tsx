/**
 * PersonalDataTab Component
 *
 * Tab content for personal data fields (body weight, etc.).
 */

import { Input } from "../../../atoms/Input/Input";

type PersonalDataTabProps = {
  bodyWeight?: number;
  onBodyWeightChange: (value: number | undefined) => void;
};

export function PersonalDataTab({
  bodyWeight,
  onBodyWeightChange,
}: PersonalDataTabProps) {
  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Input
          label="Body Weight (kg)"
          type="number"
          value={bodyWeight?.toString() ?? ""}
          onChange={(e) =>
            onBodyWeightChange(
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          placeholder="70"
        />
      </div>
    </div>
  );
}
