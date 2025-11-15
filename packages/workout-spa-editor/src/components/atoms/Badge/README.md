# Badge Component

A versatile badge component for displaying intensity levels and target types with color coding.

## Features

- **Intensity Variants**: warmup, active, cooldown, rest, recovery, interval, other
- **Target Type Variants**: power, heart_rate, cadence, pace, stroke_type, open
- **Size Variants**: sm, md, lg
- **Icon Support**: Display icons alongside text
- **Dark Mode**: Full dark mode support with appropriate color schemes
- **Accessibility**: Semantic HTML with proper ARIA attributes

## Usage

```tsx
import { Badge } from "@/components/atoms/Badge";

// Basic usage
<Badge>Default</Badge>

// With intensity variant
<Badge variant="warmup">Warmup</Badge>
<Badge variant="active">Active</Badge>

// With target type variant
<Badge variant="power">Power</Badge>
<Badge variant="heart_rate">Heart Rate</Badge>

// With size
<Badge size="sm">Small</Badge>
<Badge size="lg">Large</Badge>

// With icon
<Badge variant="power" icon={<PowerIcon />}>Power Zone 3</Badge>
```

## Props

- `variant`: Badge color variant (intensity or target type)
- `size`: Badge size (sm, md, lg)
- `icon`: Optional icon element to display
- `className`: Additional CSS classes
- All standard HTML span attributes

## Requirements

Implements Requirements 1 and 10 from the spec:

- Requirement 1: Color coding for intensity levels
- Requirement 10: Visual indicators for target types
