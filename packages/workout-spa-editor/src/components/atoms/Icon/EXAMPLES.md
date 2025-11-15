# Icon Component Examples

Quick reference for using the Icon component in the Workout SPA Editor.

## Import

```tsx
import { Icon } from "@/components/atoms/Icon";
import { Heart, Zap, Activity, Timer } from "lucide-react";
```

## Basic Usage

```tsx
// Default icon
<Icon icon={Heart} />

// With size
<Icon icon={Heart} size="lg" />

// With color
<Icon icon={Heart} color="danger" />

// Combined
<Icon icon={Heart} size="lg" color="danger" strokeWidth={2.5} />
```

## Workout-Specific Icons

### Target Types (Requirement 10)

```tsx
// Power target
<Icon icon={Zap} color="warning" />

// Heart rate target
<Icon icon={Heart} color="danger" />

// Cadence target
<Icon icon={Gauge} color="primary" />

// Pace target
<Icon icon={Activity} color="success" />

// Open target
<Icon icon={Activity} color="muted" />
```

### Duration Types

```tsx
// Time duration
<Icon icon={Timer} color="primary" />

// Distance duration
<Icon icon={Route} color="primary" />

// Repetition block
<Icon icon={Repeat} color="primary" />
```

### Intensity Levels

```tsx
// Warmup
<Icon icon={Activity} color="primary" />

// Active
<Icon icon={Zap} color="danger" />

// Cooldown
<Icon icon={Activity} color="success" />

// Rest
<Icon icon={Pause} color="muted" />
```

## In Components

### With Badge

```tsx
<Badge variant="power" icon={<Icon icon={Zap} size="sm" />}>
  Zone 4
</Badge>
```

### With Button

```tsx
<Button>
  <Icon icon={Plus} size="sm" />
  Add Step
</Button>

<Button variant="danger">
  <Icon icon={Trash2} size="sm" />
  Delete
</Button>
```

### In Step Card

```tsx
<div className="flex items-center gap-2">
  <Icon icon={Timer} size="sm" color="secondary" />
  <span>10:00</span>
</div>

<div className="flex items-center gap-2">
  <Icon icon={Zap} size="sm" color="warning" />
  <span>250W</span>
</div>
```

## Accessibility

Always provide context for screen readers when using icons in interactive elements:

```tsx
<button aria-label="Delete step">
  <Icon icon={Trash2} color="danger" />
</button>

<button aria-label="Add new step">
  <Icon icon={Plus} color="primary" />
  <span className="sr-only">Add Step</span>
</button>
```

## Common Icon Imports

```tsx
import {
  // Target types
  Zap, // Power
  Heart, // Heart rate
  Gauge, // Cadence
  Activity, // Pace/general activity

  // Duration types
  Timer, // Time
  Route, // Distance
  Repeat, // Repetition

  // Actions
  Play, // Start
  Pause, // Pause
  Square, // Stop
  Plus, // Add
  Trash2, // Delete
  Copy, // Duplicate
  Edit, // Edit
  Save, // Save

  // File operations
  Upload, // Import
  Download, // Export
  FileText, // File

  // Settings
  Settings, // Settings
  User, // Profile
  Moon, // Dark mode
  Sun, // Light mode
} from "lucide-react";
```

## Size Reference

- `xs`: 12px - For inline text icons
- `sm`: 16px - For buttons and badges
- `md`: 20px - Default, for general use
- `lg`: 24px - For prominent icons
- `xl`: 32px - For hero sections

## Color Reference

- `default`: Standard text color
- `primary`: Brand color (blue)
- `secondary`: Muted gray
- `success`: Green (for positive actions)
- `warning`: Yellow (for caution)
- `danger`: Red (for destructive actions)
- `muted`: Very light gray (for disabled/inactive)
