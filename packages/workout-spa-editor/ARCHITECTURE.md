# Architecture Documentation

This document describes the architecture, design patterns, and technical decisions for the Workout SPA Editor.

## Table of Contents

- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Data Flow](#data-flow)
- [Validation Strategy](#validation-strategy)
- [Error Handling](#error-handling)
- [Performance Optimizations](#performance-optimizations)
- [Accessibility](#accessibility)
- [Testing Strategy](#testing-strategy)

## Overview

The Workout SPA Editor is a mobile-first React application for creating and editing KRD (Kaiord Representation Definition) workout files. It follows modern React patterns with TypeScript, Zustand for state management, and Zod for validation.

### Key Technologies

- **React 19** - UI framework with concurrent features
- **TypeScript 5** - Type safety and developer experience
- **Vite 7** - Fast build tool and dev server
- **Zustand 5** - Lightweight state management
- **Zod 3** - Schema validation
- **Radix UI** - Accessible component primitives
- **Tailwind CSS 4** - Utility-first styling

## Architecture Principles

### 1. Mobile-First Design

All components are designed for mobile devices first, then enhanced for larger screens:

- Touch-friendly interactions (44x44px minimum touch targets)
- Responsive layouts with Tailwind breakpoints
- Optimized for small screens and limited bandwidth

### 2. Atomic Design

Components are organized by complexity following Atomic Design principles:

```
Atoms → Molecules → Organisms → Templates → Pages
```

This creates a clear hierarchy and promotes reusability.

### 3. Separation of Concerns

- **Components** - Pure presentation logic
- **Store** - State management and business logic
- **Utils** - Pure functions for data transformation
- **Types** - Type definitions and schemas

### 4. Type Safety

- TypeScript strict mode enabled
- No `any` types without justification
- Zod schemas for runtime validation
- Type inference from schemas

### 5. Accessibility First

- WCAG 2.1 AA compliance
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Screen reader support

## Component Architecture

### Atomic Design Hierarchy

#### Atoms (Basic Building Blocks)

**Purpose**: Smallest, reusable UI elements

**Examples**:

- `Button` - Primary UI button with variants
- `Input` - Form input with validation
- `Badge` - Status indicator with colors
- `Icon` - Icon wrapper (lucide-react)
- `ErrorMessage` - Error display component

**Characteristics**:

- No business logic
- Highly reusable
- Minimal dependencies
- Well-documented props

#### Molecules (Simple Combinations)

**Purpose**: Combinations of atoms with specific functionality

**Examples**:

- `StepCard` - Displays workout step information
- `DurationPicker` - Duration input with type selection
- `TargetPicker` - Target input with unit selection
- `FileUpload` - File upload with validation
- `SaveButton` - Save button with loading state

**Characteristics**:

- Combine multiple atoms
- Single responsibility
- Reusable across pages
- May have local state

#### Organisms (Complex Components)

**Purpose**: Complex UI sections with business logic

**Examples**:

- `WorkoutList` - List of workout steps with interactions
- `StepEditor` - Complete step editing form
- `WorkoutStats` - Workout statistics calculation and display

**Characteristics**:

- Combine molecules and atoms
- Connect to store
- Handle complex interactions
- May have side effects

#### Templates (Page Layouts)

**Purpose**: Page-level layouts and structure

**Examples**:

- `MainLayout` - Main application layout with header

**Characteristics**:

- Define page structure
- Provide consistent layouts
- Handle global UI elements

#### Pages (Route Components)

**Purpose**: Complete pages with routing

**Examples**:

- `WelcomeSection` - File upload and welcome page
- `WorkoutSection` - Main workout editor page

**Characteristics**:

- Top-level components
- Handle routing
- Compose organisms and templates
- Manage page-level state

## State Management

### Zustand Store

The application uses a single Zustand store for global state management.

#### Store Structure

```typescript
interface WorkoutStore {
  // State
  currentWorkout: KRD | null;
  workoutHistory: KRD[];
  historyIndex: number;
  selectedStepId: string | null;
  isEditing: boolean;

  // Actions
  loadWorkout: (krd: KRD) => void;
  updateWorkout: (krd: KRD) => void;
  selectStep: (id: string | null) => void;
  setEditing: (editing: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}
```

#### Store Features

**1. Undo/Redo History**

- Maintains history of workout states (max 50)
- Tracks current position in history
- Provides undo/redo actions
- Clears redo history on new changes

**2. Selectors**

Optimized state access with memoization:

```typescript
// Get current workout
const workout = useWorkoutStore((state) => state.currentWorkout);

// Get selected step
const selectedStep = useWorkoutStore(selectSelectedStep);

// Get undo/redo state
const canUndo = useWorkoutStore((state) => state.canUndo());
```

**3. Actions**

Pure functions for state updates:

```typescript
// Load workout
loadWorkout(krd);

// Update workout (adds to history)
updateWorkout(updatedKrd);

// Undo/redo
undo();
redo();
```

### Action Creators

Complex state updates are handled by action creators in `store/actions/`:

- `createStep` - Create new workout step
- `deleteStep` - Delete step and recalculate indices
- `duplicateStep` - Duplicate step with new index

**Benefits**:

- Testable business logic
- Reusable across components
- Type-safe with TypeScript
- Easy to maintain

## Data Flow

### Unidirectional Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Store Action
    ↓
State Update
    ↓
Component Re-render
```

### Example: Editing a Step

1. User clicks "Edit" on a step card
2. `StepCard` calls `onEdit(stepId)`
3. `WorkoutSection` calls `selectStep(stepId)` and `setEditing(true)`
4. Store updates `selectedStepId` and `isEditing`
5. `StepEditor` renders with selected step
6. User modifies step and clicks "Save"
7. `StepEditor` calls `onSave(updatedStep)`
8. `WorkoutSection` calls `updateWorkout(updatedKrd)`
9. Store updates `currentWorkout` and adds to history
10. Components re-render with new state

## Validation Strategy

### Zod Schemas

All validation uses Zod schemas from `@kaiord/core`:

```typescript
import { workoutSchema, workoutStepSchema } from "@kaiord/core";

// Validate workout
const result = workoutSchema.safeParse(data);
if (!result.success) {
  // Handle validation errors
  console.error(result.error.issues);
}
```

### Validation Points

**1. File Upload**

- Validate file format (JSON)
- Validate against KRD schema
- Display specific error messages

**2. User Input**

- Real-time validation during editing
- Instant feedback on invalid values
- Type-safe with TypeScript

**3. Before Save**

- Final validation before file save
- Ensure data integrity
- Prevent invalid files

### Error Messages

Validation errors are user-friendly and actionable:

```typescript
// Bad: "Validation failed"
// Good: "Duration must be a positive number"

// Bad: "Invalid target"
// Good: "Power zone must be between 1 and 7"
```

## Error Handling

### Error Boundaries

React Error Boundaries catch component errors:

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### Error Types

**1. Validation Errors**

- User input validation
- File format validation
- Schema validation

**2. File Errors**

- File not found
- Invalid file format
- Parse errors

**3. Runtime Errors**

- Component errors
- State update errors
- Unexpected errors

### Error Display

Errors are displayed with:

- Clear error messages
- Actionable suggestions
- Retry options
- Error context

## Performance Optimizations

### Code Splitting

Vite automatically splits code by route and component:

```typescript
// Lazy load heavy components
const HeavyComponent = lazy(() => import("./HeavyComponent"));
```

### Memoization

Expensive calculations are memoized:

```typescript
// Memoize workout statistics
const stats = useMemo(() => calculateWorkoutStats(workout), [workout]);

// Memoize callbacks
const handleSave = useCallback(
  (step: WorkoutStep) => {
    updateWorkout(/* ... */);
  },
  [updateWorkout]
);
```

### Optimized Re-renders

Components use React.memo and selective subscriptions:

```typescript
// Only re-render when specific state changes
const selectedStep = useWorkoutStore(selectSelectedStep);

// Memoize component
export const StepCard = memo(({ step, onEdit, onDelete }) => {
  // ...
});
```

### Build Optimizations

- **Minification**: Terser for optimal bundle size
- **Tree Shaking**: Remove unused code
- **Code Splitting**: Automatic chunk optimization
- **Source Maps**: Enabled for debugging

## Accessibility

### WCAG 2.1 AA Compliance

The application meets WCAG 2.1 AA standards:

**1. Perceivable**

- Semantic HTML
- Alt text for images
- Color contrast ratios (4.5:1 minimum)
- Text resizing support

**2. Operable**

- Keyboard navigation
- Focus indicators
- No keyboard traps
- Sufficient time for interactions

**3. Understandable**

- Clear labels
- Consistent navigation
- Error identification
- Help and documentation

**4. Robust**

- Valid HTML
- ARIA attributes
- Screen reader support
- Cross-browser compatibility

### Keyboard Navigation

All interactive elements are keyboard accessible:

- **Tab** - Navigate between elements
- **Enter/Space** - Activate buttons
- **Escape** - Close dialogs
- **Ctrl+Z** - Undo
- **Ctrl+Y** - Redo
- **Ctrl+S** - Save

### ARIA Attributes

Components use appropriate ARIA attributes:

```typescript
<button
  aria-label="Delete step"
  aria-describedby="delete-description"
>
  <Icon name="trash" />
</button>
```

### Screen Reader Support

- Descriptive labels
- Live regions for dynamic content
- Semantic landmarks
- Skip links

## Testing Strategy

### Test Pyramid

```
       E2E Tests (Playwright)
      /                    \
     /  Integration Tests   \
    /                        \
   /      Unit Tests          \
  /__________________________ \
```

### Unit Tests (Vitest)

**Coverage**: 86.54% (target: 70%)

Test individual components and functions:

- Component rendering
- User interactions
- State updates
- Utility functions

### Integration Tests

Test component interactions:

- Form submissions
- Multi-step workflows
- Store integration
- Error handling

### E2E Tests (Playwright)

Test complete user flows:

- Load and edit workout
- Create new workout
- Save workout
- Mobile responsiveness
- Accessibility

### Component Documentation (Storybook)

Visual documentation and testing:

- All component variants
- Interactive controls
- Accessibility testing
- Usage examples

## Design Decisions

### Why Zustand?

- **Lightweight**: Minimal bundle size (~1KB)
- **Simple API**: Easy to learn and use
- **No boilerplate**: Less code than Redux
- **TypeScript**: Excellent TypeScript support
- **Performance**: Optimized re-renders

### Why Zod?

- **Type inference**: TypeScript types from schemas
- **Runtime validation**: Catch errors at runtime
- **Composable**: Build complex schemas from simple ones
- **Error messages**: Clear, actionable error messages
- **Integration**: Works with @kaiord/core

### Why Radix UI?

- **Accessibility**: WCAG 2.1 AA compliant out of the box
- **Unstyled**: Full control over styling
- **Composable**: Build custom components
- **TypeScript**: Excellent TypeScript support
- **Maintained**: Active development and support

### Why Tailwind CSS?

- **Utility-first**: Rapid development
- **Responsive**: Mobile-first by default
- **Customizable**: Full design system control
- **Performance**: Purges unused CSS
- **Developer experience**: IntelliSense support

## Future Enhancements

### Planned Features (P2+)

- **Drag-and-drop**: Reorder steps with @dnd-kit
- **User profiles**: Training zones and preferences
- **Workout library**: Local storage with IndexedDB
- **Export formats**: FIT, TCX, ZWO conversion
- **Theme system**: Light/dark modes
- **Internationalization**: Multi-language support
- **PWA**: Offline support with service workers

### Technical Improvements

- **Performance**: Virtualization for large workouts
- **Analytics**: User behavior tracking
- **Error tracking**: Sentry integration
- **Monitoring**: Real-time performance monitoring
- **Caching**: Optimize data fetching

## References

- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Zod Documentation](https://zod.dev/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
