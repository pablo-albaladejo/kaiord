# TargetPicker

A molecule component for selecting and configuring workout step targets with dynamic unit selection and validation.

## Features

- **Multiple Target Types**: Support for power, heart rate, pace, cadence, and open targets
- **Dynamic Unit Selection**: Unit options change based on selected target type
- **Range Support**: Allows min/max range inputs for applicable units
- **Real-time Validation**: Validates input values with immediate feedback
- **Type-safe**: Full TypeScript support with KRD type integration
- **Accessible**: ARIA labels and keyboard navigation support

## Usage

```tsx
import { TargetPicker } from "@/components/molecules/TargetPicker";
import { useState } from "react";
import type { Target } from "@/types/krd";

function MyComponent() {
  const [target, setTarget] = useState<Target | null>(null);

  return (
    <TargetPicker
      value={target}
      onChange={setTarget}
      error={undefined}
      disabled={false}
    />
  );
}
```

## Props

| Prop        | Type                               | Required | Default     | Description                       |
| ----------- | ---------------------------------- | -------- | ----------- | --------------------------------- |
| `value`     | `Target \| null`                   | Yes      | -           | Current target value              |
| `onChange`  | `(target: Target \| null) => void` | Yes      | -           | Callback when target changes      |
| `error`     | `string`                           | No       | `undefined` | External error message to display |
| `disabled`  | `boolean`                          | No       | `false`     | Whether the picker is disabled    |
| `className` | `string`                           | No       | `""`        | Additional CSS classes            |

## Target Types

### Power

- **Units**: watts, percent_ftp, zone (1-7), range
- **Validation**:
  - Watts: 0-2000
  - Percent FTP: 0-200%
  - Zone: 1-7 (integer)

### Heart Rate

- **Units**: bpm, zone (1-5), percent_max, range
- **Validation**:
  - BPM: 0-250
  - Zone: 1-5 (integer)
  - Percent Max: 0-100%

### Pace

- **Units**: mps (meters per second), zone (1-5), range
- **Validation**:
  - m/s: 0-20
  - Zone: 1-5 (integer)

### Cadence

- **Units**: rpm, range
- **Validation**:
  - RPM: 0-300

### Open

- No units or values required
- Represents no specific intensity goal

## Examples

### Power Target (Watts)

```tsx
<TargetPicker
  value={{
    type: "power",
    value: { unit: "watts", value: 250 },
  }}
  onChange={setTarget}
/>
```

### Heart Rate Target (Zone)

```tsx
<TargetPicker
  value={{
    type: "heart_rate",
    value: { unit: "zone", value: 3 },
  }}
  onChange={setTarget}
/>
```

### Power Target (Range)

```tsx
<TargetPicker
  value={{
    type: "power",
    value: { unit: "range", min: 200, max: 250 },
  }}
  onChange={setTarget}
/>
```

### Open Target

```tsx
<TargetPicker value={{ type: "open" }} onChange={setTarget} />
```

## Validation

The component provides real-time validation with specific error messages:

- **Required fields**: "Value is required"
- **Invalid numbers**: "Must be a valid number"
- **Negative values**: "Must be greater than 0"
- **Zone ranges**: "Power zone must be between 1 and 7"
- **Range validation**: "Minimum must be less than maximum"
- **Type-specific limits**: "Power cannot exceed 2000 watts"

## Accessibility

- All inputs have proper ARIA labels
- Error states are announced to screen readers
- Keyboard navigation fully supported
- Focus management for form fields

## Requirements

Implements requirements from the Workout SPA Editor spec:

- **Requirement 2**: Allow selection of target type (power, heart rate, pace, cadence, open)
- **Requirement 3**: Validate input against target type constraints
- **Requirement 17**: Display inline error messages with real-time validation

## Related Components

- **DurationPicker**: Similar pattern for duration selection
- **Input**: Atomic component used for all form fields
- **StepEditor**: Parent component that uses TargetPicker
