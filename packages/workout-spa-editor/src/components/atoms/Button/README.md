# Button Component

A flexible, accessible button component with multiple variants, sizes, and states.

## Features

- **4 Variants**: primary, secondary, ghost, danger
- **3 Sizes**: sm, md, lg
- **Loading State**: Shows spinner and disables interaction
- **Disabled State**: Prevents interaction with visual feedback
- **Fully Typed**: TypeScript support with proper prop types
- **Accessible**: Proper ARIA attributes and keyboard navigation

## Usage

```tsx
import { Button } from "@/components/atoms/Button";

// Basic usage
<Button>Click me</Button>

// With variant
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Delete</Button>

// With size
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With loading state
<Button loading>Loading...</Button>

// Disabled
<Button disabled>Disabled</Button>

// With onClick handler
<Button onClick={() => console.log("Clicked!")}>
  Click me
</Button>

// Combining props
<Button variant="danger" size="lg" onClick={handleDelete}>
  Delete Workout
</Button>
```

## Props

| Prop        | Type                                              | Default     | Description                               |
| ----------- | ------------------------------------------------- | ----------- | ----------------------------------------- |
| `variant`   | `"primary" \| "secondary" \| "ghost" \| "danger"` | `"primary"` | Visual style variant                      |
| `size`      | `"sm" \| "md" \| "lg"`                            | `"md"`      | Button size                               |
| `loading`   | `boolean`                                         | `false`     | Shows loading spinner and disables button |
| `disabled`  | `boolean`                                         | `false`     | Disables button interaction               |
| `className` | `string`                                          | `""`        | Additional CSS classes                    |
| `children`  | `ReactNode`                                       | -           | Button content                            |
| ...rest     | `ButtonHTMLAttributes`                            | -           | All standard button HTML attributes       |

## Variants

### Primary

Default variant with primary brand color. Use for main actions.

### Secondary

Outlined variant with subtle background. Use for secondary actions.

### Ghost

Transparent background with hover effect. Use for tertiary actions or in toolbars.

### Danger

Red variant for destructive actions. Use for delete, remove, or cancel operations.

## Accessibility

- Proper `button` role
- Keyboard navigation support (Enter, Space)
- Focus indicators with ring
- Disabled state prevents interaction
- Loading state shows spinner with `aria-hidden`
- Supports all standard ARIA attributes

## Examples

### Save Button with Loading

```tsx
const [saving, setSaving] = useState(false);

<Button
  variant="primary"
  loading={saving}
  onClick={async () => {
    setSaving(true);
    await saveWorkout();
    setSaving(false);
  }}
>
  Save Workout
</Button>;
```

### Delete Confirmation

```tsx
<Button variant="danger" size="sm" onClick={() => setShowConfirmDialog(true)}>
  Delete
</Button>
```

### Toolbar Actions

```tsx
<div className="flex gap-2">
  <Button variant="ghost" size="sm">
    <Icon name="copy" />
    Copy
  </Button>
  <Button variant="ghost" size="sm">
    <Icon name="paste" />
    Paste
  </Button>
</div>
```
