# Input Component

A flexible and accessible input component that supports text, number, and select variants with comprehensive error handling and styling.

## Features

- **Multiple Variants**: Text, number, and select inputs
- **Size Options**: Small, medium, and large sizes
- **Error States**: Built-in error message display with proper styling
- **Helper Text**: Optional helper text for additional context
- **Labels**: Accessible label support
- **Accessibility**: Full ARIA support with proper associations
- **Dark Mode**: Automatic dark mode support
- **Ref Forwarding**: Supports ref forwarding to underlying elements

## Usage

### Text Input

```tsx
import { Input } from "@/components/atoms/Input";

// Basic text input
<Input placeholder="Enter text..." />

// With label and helper text
<Input
  label="Username"
  placeholder="Enter your username"
  helperText="Choose a unique username"
/>

// With error
<Input
  label="Email"
  placeholder="you@example.com"
  error="Please enter a valid email address"
/>
```

### Number Input

```tsx
// Basic number input
<Input variant="number" placeholder="Enter number..." />

// With constraints
<Input
  variant="number"
  label="Age"
  min={0}
  max={120}
  step={1}
  helperText="Enter your age in years"
/>

// With error
<Input
  variant="number"
  label="Power (watts)"
  min={50}
  max={500}
  error="Power must be between 50 and 500 watts"
/>
```

### Select Input

```tsx
// Basic select
<Input
  variant="select"
  options={[
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
  ]}
/>

// With label and helper text
<Input
  variant="select"
  label="Sport"
  helperText="Select your primary sport"
  options={[
    { value: "cycling", label: "Cycling" },
    { value: "running", label: "Running" },
    { value: "swimming", label: "Swimming" },
  ]}
/>

// With default value
<Input
  variant="select"
  label="Intensity"
  defaultValue="active"
  options={[
    { value: "warmup", label: "Warmup" },
    { value: "active", label: "Active" },
    { value: "cooldown", label: "Cooldown" },
  ]}
/>
```

## Props

### Common Props

| Prop         | Type                             | Default  | Description                           |
| ------------ | -------------------------------- | -------- | ------------------------------------- |
| `variant`    | `"text" \| "number" \| "select"` | `"text"` | The type of input to render           |
| `size`       | `"sm" \| "md" \| "lg"`           | `"md"`   | The size of the input                 |
| `label`      | `string`                         | -        | Label text for the input              |
| `helperText` | `string`                         | -        | Helper text displayed below the input |
| `error`      | `string`                         | -        | Error message to display              |
| `className`  | `string`                         | `""`     | Additional CSS classes                |
| `disabled`   | `boolean`                        | `false`  | Whether the input is disabled         |

### Text/Number Specific Props

All standard HTML input attributes are supported, including:

- `placeholder`
- `value`
- `defaultValue`
- `onChange`
- `onBlur`
- `onFocus`
- `min` (number only)
- `max` (number only)
- `step` (number only)

### Select Specific Props

| Prop      | Type                                      | Required | Description                    |
| --------- | ----------------------------------------- | -------- | ------------------------------ |
| `options` | `Array<{ value: string; label: string }>` | Yes      | Options for the select element |

All standard HTML select attributes are also supported.

## Accessibility

The Input component follows accessibility best practices:

- **Labels**: Properly associated with inputs using `htmlFor` and `id`
- **ARIA Attributes**:
  - `aria-invalid` set to `true` when error is present
  - `aria-describedby` links to helper text or error message
  - Error messages have `role="alert"` for screen readers
- **Keyboard Navigation**: Full keyboard support for all variants
- **Focus Management**: Clear focus indicators with ring styles

## Styling

The component uses Tailwind CSS with the following features:

- **Responsive**: Works on all screen sizes
- **Dark Mode**: Automatic dark mode support
- **Error States**: Red border and background when error is present
- **Disabled States**: Reduced opacity and cursor changes
- **Focus States**: Clear focus rings with primary color

## Examples

### Form with Validation

```tsx
const [errors, setErrors] = useState({});

<form>
  <Input
    label="Workout Name"
    placeholder="Morning Intervals"
    error={errors.name}
    helperText="Give your workout a descriptive name"
  />

  <Input
    variant="number"
    label="Duration (minutes)"
    min={1}
    max={300}
    error={errors.duration}
  />

  <Input
    variant="select"
    label="Sport"
    error={errors.sport}
    options={[
      { value: "cycling", label: "Cycling" },
      { value: "running", label: "Running" },
    ]}
  />
</form>;
```

### Controlled Input

```tsx
const [value, setValue] = useState("");

<Input
  label="Username"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  helperText={`${value.length}/20 characters`}
/>;
```

### With Ref

```tsx
const inputRef = useRef<HTMLInputElement>(null);

<Input
  ref={inputRef}
  label="Focus me"
/>

<button onClick={() => inputRef.current?.focus()}>
  Focus Input
</button>
```

## Requirements Satisfied

This component satisfies the following requirements from the spec:

- **Requirement 2**: Allows selection of duration type, target type, and configuration of workout steps
- **Requirement 3**: Provides edit interface with validation for modifying step values
- **Requirement 17**: Displays inline error messages with real-time validation feedback

## Related Components

- `Button` - For form submission
- `FormField` (molecule) - Combines Input with additional form logic
- `DurationPicker` (molecule) - Uses Input for duration configuration
- `TargetPicker` (molecule) - Uses Input for target configuration
