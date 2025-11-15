# StepCard

A molecule component that displays a workout step with its duration, target, intensity, and optional notes.

## Features

- **Visual Hierarchy**: Clear display of step index, intensity, duration, and target
- **Color Coding**: Intensity-based color coding using Badge component
- **Icon Support**: Visual icons for different target and duration types
- **Interactive**: Clickable with keyboard navigation support
- **Selection State**: Visual feedback for selected state
- **Responsive**: Mobile-optimized with touch-friendly targets

## Usage

```tsx
import { StepCard } from "@/components/molecules/StepCard/StepCard";
import type { WorkoutStep } from "@/types/krd";

const step: WorkoutStep = {
  stepIndex: 0,
  durationType: "time",
  duration: {
    type: "time",
    seconds: 300,
  },
  targetType: "power",
  target: {
    type: "power",
    value: {
      unit: "watts",
      value: 200,
    },
  },
  intensity: "warmup",
  name: "Warm Up",
  notes: "Easy pace, focus on form",
};

function MyComponent() {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  return (
    <StepCard
      step={step}
      isSelected={selectedStep === step.stepIndex}
      onSelect={(stepIndex) => setSelectedStep(stepIndex)}
    />
  );
}
```

## Props

| Prop         | Type                          | Default | Description                                |
| ------------ | ----------------------------- | ------- | ------------------------------------------ |
| `step`       | `WorkoutStep`                 | -       | The workout step data to display           |
| `isSelected` | `boolean`                     | `false` | Whether the step is currently selected     |
| `onSelect`   | `(stepIndex: number) => void` | -       | Callback when step is clicked or activated |
| `className`  | `string`                      | `""`    | Additional CSS classes                     |

## Intensity Color Coding

The component uses the Badge component to display intensity with appropriate colors:

- **Warmup**: Blue
- **Active**: Red
- **Cooldown**: Cyan
- **Rest**: Gray
- **Recovery**: Green
- **Interval**: Orange
- **Other**: Purple

## Target Type Icons

Different target types are displayed with distinct icons:

- **Power**: Zap (⚡)
- **Heart Rate**: Heart (❤️)
- **Cadence**: Repeat (🔄)
- **Pace**: Activity (🏃)
- **Open**: Gauge (📊)

## Duration Type Icons

Duration types are displayed with appropriate icons:

- **Time**: Clock (🕐)
- **Distance**: Ruler (📏)
- **Other**: Clock (🕐)

## Formatting

### Duration Formatting

- **Time**: `5 min` or `5:30` (minutes:seconds)
- **Distance**: `5.00 km` or `400 m`
- **Calories**: `100 cal`
- **Open**: `Open`

### Target Formatting

- **Power**:
  - Watts: `200W`
  - FTP Percentage: `85% FTP`
  - Zone: `Zone 4`
  - Range: `180-220W`
- **Heart Rate**:
  - BPM: `150 bpm`
  - Percentage: `85% max`
  - Zone: `Zone 3`
  - Range: `140-160 bpm`
- **Cadence**:
  - RPM: `90 rpm`
  - Range: `85-95 rpm`
- **Pace**:
  - Min/km: `5:30/km`
  - Zone: `Zone 2`
- **Open**: `Open`

## Accessibility

- Semantic HTML with proper ARIA labels
- Keyboard navigation support (Enter and Space keys)
- Focus indicators
- Screen reader friendly
- Touch-friendly targets (minimum 44x44px)

## Requirements

Implements requirements:

- **Requirement 1**: Display workout steps with duration and target information
- **Requirement 10**: Visual indicators for different target types with distinct colors and icons

## Related Components

- [Badge](../../atoms/Badge/README.md) - Used for intensity and target type display
- [Icon](../../atoms/Icon/README.md) - Used for target and duration type icons
