# WorkoutList

An organism component that renders a list of workout steps and repetition blocks with visual grouping.

## Requirements

- **Requirement 1**: Display workout structure in a clear visual format
  - Renders each workout step with duration and target information
  - Visually groups repetition blocks with repeat count
  - Uses color coding for intensity levels
  - Optimized for mobile with vertically scrollable list

## Features

- Renders individual workout steps using StepCard components
- Visually groups repetition blocks with:
  - Dashed border styling
  - Repeat count badge
  - Indented step list with left border
  - Distinct background color
- Handles step selection with visual feedback
- Supports mixed content (steps and repetition blocks)
- Accessible with proper ARIA roles and labels
- Mobile-first responsive design

## Usage

```tsx
import { WorkoutList } from "@/components/organisms/WorkoutList/WorkoutList";
import { useWorkoutStore } from "@/store/workout-store";

function WorkoutEditor() {
  const workout = useWorkoutStore((state) => state.currentWorkout);
  const selectedStepId = useWorkoutStore((state) => state.selectedStepId);
  const selectStep = useWorkoutStore((state) => state.selectStep);

  if (!workout?.extensions?.workout) {
    return <div>No workout loaded</div>;
  }

  return (
    <WorkoutList
      workout={workout.extensions.workout}
      selectedStepId={selectedStepId}
      onStepSelect={(stepIndex) => selectStep(`step-${stepIndex}`)}
    />
  );
}
```

## Props

```typescript
type WorkoutListProps = HTMLAttributes<HTMLDivElement> & {
  // The workout to display
  workout: Workout;

  // ID of the currently selected step (format: "step-{stepIndex}")
  selectedStepId?: string | null;

  // Callback when a step is selected
  onStepSelect?: (stepIndex: number) => void;
};
```

## Visual Structure

### Individual Steps

Steps are rendered as StepCard components with:

- Step number
- Intensity badge
- Duration with icon
- Target with icon
- Optional name
- Optional notes

### Repetition Blocks

Repetition blocks are visually distinct with:

- Dashed border (primary color)
- Light background tint
- "Repeat Nx" label
- Indented step list with left border
- All contained steps rendered as StepCards

## Accessibility

- Uses `role="list"` with `aria-label="Workout steps"`
- Each StepCard is keyboard accessible
- Proper focus management
- Screen reader friendly labels

## Styling

The component uses Tailwind CSS with:

- Responsive gap spacing
- Dark mode support
- Primary color theme for repetition blocks
- Hover and focus states
- Smooth transitions

## Examples

### Simple Workout

```tsx
<WorkoutList
  workout={{
    name: "Easy Ride",
    sport: "cycling",
    steps: [warmupStep, mainSetStep, cooldownStep],
  }}
/>
```

### With Repetition Blocks

```tsx
<WorkoutList
  workout={{
    name: "Intervals",
    sport: "cycling",
    steps: [
      warmupStep,
      {
        repeatCount: 5,
        steps: [intervalStep, recoveryStep],
      },
      cooldownStep,
    ],
  }}
/>
```

### With Selection

```tsx
<WorkoutList
  workout={workout}
  selectedStepId="step-2"
  onStepSelect={(stepIndex) => console.log(`Selected step ${stepIndex}`)}
/>
```

## Testing

The component includes comprehensive tests for:

- Rendering individual steps
- Rendering repetition blocks with visual grouping
- Step selection handling
- Selected step highlighting
- Mixed content (steps and blocks)
- Custom className application

Run tests with:

```bash
pnpm test WorkoutList
```

## Related Components

- **StepCard**: Molecule component for individual workout steps
- **Badge**: Atom component for intensity and target type badges
- **Icon**: Atom component for duration and target icons
