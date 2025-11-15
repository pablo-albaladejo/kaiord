# Icon Component

A flexible icon wrapper component using lucide-react icons with size and color variants.

## Features

- Multiple size variants (xs, sm, md, lg, xl)
- Color variants for different contexts
- Customizable stroke width
- Full TypeScript support
- Dark mode support

## Usage

```tsx
import { Icon } from "@/components/atoms/Icon/Icon";
import { Heart, Zap, Activity } from "lucide-react";

// Basic usage
<Icon icon={Heart} />

// With size variant
<Icon icon={Zap} size="lg" />

// With color variant
<Icon icon={Activity} color="primary" />

// With custom stroke width
<Icon icon={Heart} strokeWidth={3} />

// Combined
<Icon icon={Zap} size="xl" color="danger" strokeWidth={2.5} />
```

## Props

| Prop          | Type                                                                                     | Default     | Description                               |
| ------------- | ---------------------------------------------------------------------------------------- | ----------- | ----------------------------------------- |
| `icon`        | `LucideIcon`                                                                             | required    | The lucide-react icon component to render |
| `size`        | `"xs" \| "sm" \| "md" \| "lg" \| "xl"`                                                   | `"md"`      | Size of the icon                          |
| `color`       | `"default" \| "primary" \| "secondary" \| "success" \| "warning" \| "danger" \| "muted"` | `"default"` | Color variant                             |
| `strokeWidth` | `number`                                                                                 | `2`         | Stroke width of the icon                  |
| `className`   | `string`                                                                                 | `""`        | Additional CSS classes                    |

## Size Variants

- `xs`: 12px (w-3 h-3)
- `sm`: 16px (w-4 h-4)
- `md`: 20px (w-5 h-5)
- `lg`: 24px (w-6 h-6)
- `xl`: 32px (w-8 h-8)

## Color Variants

- `default`: Gray text (adapts to dark mode)
- `primary`: Primary brand color
- `secondary`: Secondary gray
- `success`: Green
- `warning`: Yellow
- `danger`: Red
- `muted`: Muted gray

## Common Icons for Workout Editor

```tsx
import {
  Activity, // General activity
  Heart, // Heart rate
  Zap, // Power
  Gauge, // Cadence
  Timer, // Time duration
  Route, // Distance
  Repeat, // Repetition blocks
  Play, // Start
  Pause, // Pause
  Square, // Stop
  Plus, // Add step
  Trash2, // Delete
  Copy, // Duplicate
  Edit, // Edit
  Save, // Save
  Upload, // Import
  Download, // Export
  Settings, // Settings
  User, // Profile
  Moon, // Dark mode
  Sun, // Light mode
} from "lucide-react";
```

## Accessibility

The Icon component uses a `<span>` wrapper to ensure proper layout and styling. For interactive icons (buttons, links), wrap the Icon in an appropriate interactive element with proper ARIA labels:

```tsx
<button aria-label="Delete step">
  <Icon icon={Trash2} color="danger" />
</button>
```

## Examples

### Target Type Icons

```tsx
<Icon icon={Zap} color="warning" />      {/* Power */}
<Icon icon={Heart} color="danger" />     {/* Heart Rate */}
<Icon icon={Gauge} color="primary" />    {/* Cadence */}
<Icon icon={Activity} color="success" /> {/* Pace */}
```

### Action Icons

```tsx
<Icon icon={Plus} size="sm" />
<Icon icon={Trash2} size="sm" color="danger" />
<Icon icon={Copy} size="sm" color="secondary" />
<Icon icon={Edit} size="sm" color="primary" />
```

### Status Icons

```tsx
<Icon icon={Play} color="success" />
<Icon icon={Pause} color="warning" />
<Icon icon={Square} color="danger" />
```
