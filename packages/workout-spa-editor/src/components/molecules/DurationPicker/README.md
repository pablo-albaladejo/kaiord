# DurationPicker

A molecule component for selecting and configuring workout step durations.

## Features

- **Duration Type Selection**: Choose between time, distance, or open duration types
- **Real-time Validation**: Immediate feedback on invalid inputs
- **Type-safe**: Full TypeScript support with proper Duration types from @kaiord/core
- **Accessible**: ARIA labels and keyboard navigation support
- **Error Display**: Shows both external and validation errors

## Usage

```tsx
import { DurationPicker } from "@/components/molecules/DurationPicker";
import { useState } from "react";
import type { Duration } from "@/types/krd";

function MyComponent() {
  const [duration, setDuration] = useState<Duration | null>(null);

  return (
    <DurationPicker
      value={duration}
      onChange={setDuration}
      error={undefined}
      disabled={false}
    />
  );
}
```

## Props

| Prop        | Type                                   | Required | Description                       |
| ----------- | -------------------------------------- | -------- | --------------------------------- |
| `value`     | `Duration \| null`                     | Yes      | Current duration value            |
| `onChange`  | `(duration: Duration \| null) => void` | Yes      | Callback when duration changes    |
| `error`     | `string`                               | No       | External error message to display |
| `disabled`  | `boolean`                              | No       | Whether the picker is disabled    |
| `className` | `string`                               | No       | Additional CSS classes            |

## Duration Types

The component supports three duration types:

### Time Duration

- **Type**: `{ type: "time", seconds: number }`
- **Validation**: Must be positive, max 24 hours (86400 seconds)
- **Example**: `{ type: "time", seconds: 300 }` (5 minutes)

### Distance Duration

- **Type**: `{ type: "distance", meters: number }`
- **Validation**: Must be positive, max 1000 km (1,000,000 meters)
- **Example**: `{ type: "distance", meters: 5000 }` (5 km)

### Open Duration

- **Type**: `{ type: "open" }`
- **Description**: Open-ended duration (manual lap button)
- **Example**: `{ type: "open" }`

## Validation

The component provides real-time validation with the following rules:

- **Required**: Value must be provided for time and distance types
- **Positive**: Values must be greater than 0
- **Numeric**: Values must be valid numbers
- **Range Limits**:
  - Time: 0 < seconds ≤ 86400 (24 hours)
  - Distance: 0 < meters ≤ 1,000,000 (1000 km)

## Examples

### Basic Usage

```tsx
<DurationPicker
  value={{ type: "time", seconds: 600 }}
  onChange={(duration) => console.log(duration)}
/>
```

### With Error

```tsx
<DurationPicker
  value={null}
  onChange={setDuration}
  error="Duration is required"
/>
```

### Disabled State

```tsx
<DurationPicker
  value={{ type: "distance", meters: 1000 }}
  onChange={setDuration}
  disabled
/>
```

## Requirements

This component implements the following requirements:

- **Requirement 2**: Support for creating workout steps with duration configuration
- **Requirement 3**: Real-time validation and error display
- **Requirement 17**: Inline validation errors with immediate feedback

## Testing

The component has comprehensive test coverage including:

- Rendering tests for all duration types
- Type selection behavior
- Value input validation (time and distance)
- Error display (external and validation errors)
- Disabled state

Run tests with:

```bash
npm test -- DurationPicker
```

## File Structure

```
DurationPicker/
├── DurationPicker.tsx          # Main component
├── DurationPicker.types.ts     # TypeScript types
├── DurationPicker.test.tsx     # Test suite
├── DurationPicker.stories.tsx  # Storybook stories
├── helpers.ts                  # Helper functions
├── hooks.ts                    # Custom hooks
├── validation.ts               # Validation logic
├── index.ts                    # Public exports
└── README.md                   # This file
```
