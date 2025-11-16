# StepEditor

A form organism for editing workout step properties including duration and target.

## Features

- Edit step duration using DurationPicker
- Edit step target using TargetPicker
- Real-time validation with error display
- Save and cancel actions
- Disabled save button when validation errors exist
- Reverts changes on cancel

## Usage

```tsx
import { StepEditor } from "./components/organisms/StepEditor/StepEditor";

const MyComponent = () => {
  const [selectedStep, setSelectedStep] = useState<WorkoutStep | null>(null);

  const handleSave = (updatedStep: WorkoutStep) => {
    // Update workout state
    console.log("Saving step:", updatedStep);
    setSelectedStep(null);
  };

  const handleCancel = () => {
    setSelectedStep(null);
  };

  return (
    <StepEditor
      step={selectedStep}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};
```

## Props

| Prop        | Type                          | Required | Description                                  |
| ----------- | ----------------------------- | -------- | -------------------------------------------- |
| `step`      | `WorkoutStep \| null`         | Yes      | The step to edit, or null to hide the editor |
| `onSave`    | `(step: WorkoutStep) => void` | Yes      | Callback when user saves changes             |
| `onCancel`  | `() => void`                  | Yes      | Callback when user cancels editing           |
| `className` | `string`                      | No       | Additional CSS classes                       |

## Behavior

### Validation

- Duration and target validation errors are displayed inline
- Save button is disabled when validation errors exist
- Errors are cleared when user corrects the input

### Cancel Action

- Reverts all changes to original step values
- Clears all validation errors
- Calls `onCancel` callback

### Save Action

- Only enabled when no validation errors exist
- Updates step with new duration and target values
- Calls `onSave` callback with updated step

## Requirements

Implements Requirement 3:

- 3.1: Displays edit interface with current step values
- 3.2: Validates duration input and updates immediately
- 3.3: Validates target input against type constraints
- 3.4: Updates KRD data structure on save
- 3.5: Reverts to original values on cancel

## Accessibility

- Semantic HTML structure
- ARIA labels on buttons
- Keyboard navigation support
- Focus management
- Error announcements via ARIA

## Dependencies

- `DurationPicker` - For editing step duration
- `TargetPicker` - For editing step target
- `Button` - For save and cancel actions
- `@kaiord/core` - For WorkoutStep, Duration, and Target types
