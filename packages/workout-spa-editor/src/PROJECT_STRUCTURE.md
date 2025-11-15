# Project Structure

This document describes the folder structure and import conventions for the Workout SPA Editor.

## Folder Structure

```
src/
├── components/          # UI components following Atomic Design
│   ├── atoms/          # Basic building blocks (Button, Input, Badge, Icon)
│   ├── molecules/      # Simple combinations (FormField, StepCard, DurationPicker)
│   ├── organisms/      # Complex components (WorkoutList, StepEditor, WorkoutChart)
│   └── templates/      # Page layouts (MainLayout, EditorLayout)
├── pages/              # Page components (routes)
├── hooks/              # Custom React hooks
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Import Conventions

**DIRECT IMPORTS ONLY** - Always import directly from source files to enable optimal tree-shaking and bundle optimization.

### ✅ Correct - Direct imports from source files

```typescript
// Import components directly from their source files
import { Button } from "@/components/atoms/Button/Button";
import { StepCard } from "@/components/molecules/StepCard/StepCard";
import { WorkoutList } from "@/components/organisms/WorkoutList/WorkoutList";

// Import hooks directly
import { useWorkout } from "@/hooks/useWorkout";

// Import store directly
import { useWorkoutStore } from "@/store/workoutStore";

// Import types directly
import type { WorkoutStep } from "@/types/workout";

// Import utils directly
import { formatDuration } from "@/utils/formatters";
```

### ❌ Incorrect - Barrel exports (DO NOT USE)

```typescript
// DON'T use index.ts barrel exports (even though they exist)
import { Button } from "@/components/atoms"; // ❌ NO
import { Button } from "@/components/atoms/Button"; // ❌ NO (uses index.ts)
import { useWorkout } from "@/hooks"; // ❌ NO
```

### Note on Existing index.ts Files

Some `index.ts` files exist in the codebase for legacy reasons or future extensibility, but they are **not used** in imports. Always import directly from the source file (e.g., `Button.tsx`, `StepCard.tsx`) to ensure:

- **Optimal tree-shaking**: Bundler can eliminate unused code more effectively
- **Faster builds**: No intermediate re-export resolution
- **Clear dependencies**: Explicit file paths make refactoring safer
- **Better IDE support**: Direct imports provide more accurate jump-to-definition

## Path Aliases

The `@/` alias is configured to point to the `src/` directory:

- `@/components/atoms/Button` → `src/components/atoms/Button`
- `@/hooks/useWorkout` → `src/hooks/useWorkout`
- `@/store/workoutStore` → `src/store/workoutStore`

## Atomic Design Principles

### Atoms

Basic building blocks that can't be broken down further:

- Button, Input, Select, Badge, Icon, Tooltip

### Molecules

Simple combinations of atoms:

- FormField (Label + Input + Error)
- StepCard (Badge + Icon + Text)
- DurationPicker (Select + Input)

### Organisms

Complex components with business logic:

- WorkoutList (multiple StepCards)
- StepEditor (form with multiple molecules)
- WorkoutChart (visualization)

### Templates

Page layouts that define structure:

- MainLayout (header + content + footer)
- EditorLayout (sidebar + main area)

## File Naming Conventions

- **Components**: PascalCase with `.tsx` extension
  - `Button.tsx`, `StepCard.tsx`, `WorkoutList.tsx`
- **Hooks**: camelCase starting with `use` and `.ts` extension
  - `useWorkout.ts`, `useKeyboardShortcuts.ts`
- **Store**: camelCase with `Store` suffix and `.ts` extension
  - `workoutStore.ts`, `profileStore.ts`
- **Types**: camelCase with `.ts` extension
  - `workout.ts`, `profile.ts`
- **Utils**: camelCase with `.ts` extension
  - `formatters.ts`, `validators.ts`

## Benefits of Direct Imports

1. **Better Tree-Shaking**: Bundler can eliminate unused code more effectively
2. **Faster Builds**: No need to process barrel export files
3. **Clearer Dependencies**: Explicit imports show exact file dependencies
4. **Smaller Bundle Size**: Only imports what's actually used
5. **Better IDE Performance**: Faster autocomplete and navigation
