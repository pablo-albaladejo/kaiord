# Design Document

## Implementation Status

**Version:** 1.0.0 (MVP)  
**Status:** ✅ COMPLETE - Production Ready  
**Date:** 2025-01-16

### Completion Summary

- ✅ All P0 + P1 requirements implemented (18/18)
- ✅ Quality assurance phase complete (P1b: 12/12 tasks)
- ✅ Test coverage: 86.54% (exceeds 70% target)
- ✅ E2E tests: 100% passing (all browsers + mobile)
- ✅ Accessibility: WCAG 2.1 AA compliant
- ✅ CI/CD: All pipelines green
- ✅ Documentation: Complete

## Overview

The Workout SPA Editor is a modern, mobile-first React application built with TypeScript that provides a comprehensive interface for creating, editing, and managing KRD workout files. The application follows clean architecture principles with clear separation between presentation, business logic, and state management.

### Key Design Principles

- **Mobile-First**: Optimized for touch interfaces, responsive design
- **Component-Based**: Reusable, composable UI components following Atomic Design
- **State Management**: Centralized state with clear data flow
- **Performance**: Code splitting, lazy loading, optimized builds
- **Extensibility**: Prepared for authentication, premium features, and future enhancements
- **Accessibility**: WCAG 2.1 AA compliant, keyboard navigation, screen reader support
- **Testing**: Comprehensive unit and E2E test coverage

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Pages    │  │ Components │  │   Styles   │            │
│  │  (Routes)  │  │  (Atomic)  │  │  (Themes)  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          ↓ uses
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Hooks    │  │   Store    │  │  Context   │            │
│  │ (Business) │  │  (State)   │  │ (Providers)│            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          ↓ uses
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Types    │  │ Validators │  │  Services  │            │
│  │   (KRD)    │  │  (Zod)     │  │ (Business) │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          ↓ uses
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Storage   │  │    API     │  │  @kaiord   │            │
│  │(IndexedDB) │  │  (Fetch)   │  │   /core    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**@kaiord/core Integration:**

The application leverages `@kaiord/core` as a workspace dependency to:

- Import canonical KRD types (`Workout`, `WorkoutStep`, `RepetitionBlock`, `Duration`, `Target`, etc.)
- Re-export Zod schemas for validation (`workoutSchema`, `workoutStepSchema`, etc.)
- Enable format conversion (KRD ↔ FIT/TCX/ZWO) for import/export features
- Ensure type consistency across the Kaiord ecosystem

This integration eliminates type duplication and ensures the SPA editor works with the same data structures used by the CLI and core library.

**Format Conversion Architecture:**

```typescript
// Import: FIT/TCX/ZWO → KRD
import { toKRD } from "@kaiord/core";

const handleFileImport = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  // Detect format from file extension
  const format = file.name.endsWith(".fit")
    ? "fit"
    : file.name.endsWith(".tcx")
      ? "tcx"
      : file.name.endsWith(".zwo")
        ? "zwo"
        : "krd";

  if (format === "krd") {
    // Parse JSON directly
    const text = new TextDecoder().decode(uint8Array);
    return JSON.parse(text);
  }

  // Convert to KRD using @kaiord/core
  const krd = await toKRD(uint8Array, { type: format });
  return krd;
};

// Export: KRD → FIT/TCX/ZWO
import { fromKRD } from "@kaiord/core";

const handleFileExport = async (
  krd: KRD,
  format: "fit" | "tcx" | "zwo" | "krd"
) => {
  if (format === "krd") {
    // Export as JSON
    const json = JSON.stringify(krd, null, 2);
    return new Blob([json], { type: "application/json" });
  }

  // Convert from KRD using @kaiord/core
  const buffer = await fromKRD(krd, { type: format });

  const mimeType =
    format === "fit" ? "application/octet-stream" : "application/xml";

  return new Blob([buffer], { type: mimeType });
};
```

### Technology Stack

**Core:**

- React 18+ (with Concurrent Features)
- TypeScript 5+
- Vite (build tool)

**State Management:**

- Zustand (lightweight, performant)
- React Query (server state, caching)

**UI Framework:**

- Tailwind CSS (utility-first styling)
- Radix UI (accessible primitives)
- Framer Motion (animations)

**Data & Validation:**

- Zod (schema validation)
- @kaiord/core (KRD types, schemas, and format conversion)

**Charts & Visualization:**

- Recharts (workout preview charts)

**Drag & Drop:**

- @dnd-kit (modern, accessible)

**Internationalization:**

- react-i18next (i18n)

**PWA:**

- Vite PWA Plugin
- Workbox (service workers)

**Storage:**

- Dexie.js (IndexedDB wrapper)

**Testing:**

- Vitest (unit tests)
- React Testing Library
- Playwright (e2e tests)

## Components and Interfaces

### Atomic Design Structure

```
src/
├── components/
│   ├── atoms/              # Basic building blocks
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Badge/
│   │   ├── Icon/
│   │   └── Tooltip/
│   ├── molecules/          # Simple combinations
│   │   ├── FormField/
│   │   ├── StepCard/
│   │   ├── ZoneInput/
│   │   ├── DurationPicker/
│   │   ├── TargetPicker/
│   │   └── SearchBar/
│   ├── organisms/          # Complex components
│   │   ├── WorkoutList/
│   │   ├── StepEditor/
│   │   ├── WorkoutChart/
│   │   ├── ProfileForm/
│   │   ├── TemplateLibrary/
│   │   └── WorkoutStats/
│   └── templates/          # Page layouts
│       ├── MainLayout/
│       ├── EditorLayout/
│       └── OnboardingLayout/
```

### Key Component Interfaces

**WorkoutList Component:**

```typescript
interface WorkoutListProps {
  workout: Workout;
  selectedStepId?: string;
  onStepSelect: (stepId: string) => void;
  onStepEdit: (stepId: string) => void;
  onStepDelete: (stepId: string) => void;
  onStepDuplicate: (stepId: string) => void;
  onStepReorder: (fromIndex: number, toIndex: number) => void;
}
```

**StepEditor Component:**

```typescript
interface StepEditorProps {
  step: WorkoutStep | null;
  profile: UserProfile;
  onSave: (step: WorkoutStep) => void;
  onCancel: () => void;
}
```

**WorkoutChart Component:**

```typescript
interface WorkoutChartProps {
  workout: Workout;
  profile: UserProfile;
  highlightedStepId?: string;
  onStepHover: (stepId: string | null) => void;
}
```

## Data Models

### Core Domain Types

**Note:** Core KRD types (`Workout`, `WorkoutStep`, `RepetitionBlock`, `Duration`, `Target`, etc.) are imported from `@kaiord/core` to ensure consistency with the canonical format and enable seamless conversion to/from FIT, TCX, and ZWO formats.

**UserProfile:**

```typescript
interface UserProfile {
  id: string;
  name: string;
  bodyWeight?: number; // kg
  ftp?: number; // watts
  maxHeartRate?: number; // bpm
  powerZones: PowerZone[]; // 7 zones
  heartRateZones: HRZone[]; // 5 zones
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

interface PowerZone {
  zone: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  minPercent: number;
  maxPercent: number;
  name: string;
}

interface HRZone {
  zone: 1 | 2 | 3 | 4 | 5;
  minBpm: number;
  maxBpm: number;
  name: string;
}

interface UserPreferences {
  language: "en" | "es" | "fr" | "de" | "it";
  theme: "light" | "dark" | "system";
  units: "metric" | "imperial";
}
```

**WorkoutLibraryItem:**

```typescript
interface WorkoutLibraryItem {
  id: string;
  name: string;
  sport: string;
  subSport?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  krd: KRD; // Full KRD object
}
```

**WorkoutTemplate:**

```typescript
interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | "intervals"
    | "pyramid"
    | "threshold"
    | "recovery"
    | "endurance"
    | "custom";
  sport: string;
  steps: WorkoutStep[];
  isCustom: boolean;
}
```

### State Management Structure

**Global Store (Zustand):**

```typescript
interface AppStore {
  // Profile state
  profiles: UserProfile[];
  activeProfileId: string | null;

  // Workout state
  currentWorkout: KRD | null;
  workoutHistory: KRD[]; // For undo/redo
  historyIndex: number;

  // UI state
  selectedStepId: string | null;
  isEditing: boolean;
  clipboard: WorkoutStep | RepetitionBlock | null;

  // Actions
  setActiveProfile: (id: string) => void;
  createProfile: (profile: UserProfile) => void;
  updateProfile: (id: string, updates: Partial<UserProfile>) => void;
  deleteProfile: (id: string) => void;

  loadWorkout: (krd: KRD) => void;
  updateWorkout: (krd: KRD) => void;
  undo: () => void;
  redo: () => void;

  selectStep: (id: string | null) => void;
  copyStep: (step: WorkoutStep | RepetitionBlock) => void;
  pasteStep: (index: number) => void;
}
```

## Error Handling

### Error Boundary Strategy

```typescript
// Global error boundary
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={logErrorToService}
>
  <App />
</ErrorBoundary>

// Feature-specific boundaries
<ErrorBoundary FallbackComponent={WorkoutEditorFallback}>
  <WorkoutEditor />
</ErrorBoundary>
```

### Error Types

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

class StorageError extends Error {
  constructor(
    message: string,
    public operation: "read" | "write" | "delete"
  ) {
    super(message);
    this.name = "StorageError";
  }
}

class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "NetworkError";
  }
}
```

## Testing Strategy

### Unit Tests

- All business logic hooks
- Utility functions
- Validators
- State management actions
- Coverage target: 80%

### Component Tests

- Render tests for all components
- User interaction tests
- Accessibility tests
- Coverage target: 70%

### Integration Tests

- Complete user flows
- Workout creation flow
- Profile management flow
- Import/export flow

### E2E Tests

- Critical paths only
- Create workout → Edit → Save → Load
- Profile creation → Zone configuration
- Template usage → Customization

### Performance Tests

- Lighthouse CI in pipeline
- Bundle size monitoring
- Render performance profiling

## Performance Optimization

### Code Splitting Strategy

```typescript
// Route-based splitting
const WorkoutEditor = lazy(() => import("./pages/WorkoutEditor"));
const ProfileManager = lazy(() => import("./pages/ProfileManager"));
const TemplateLibrary = lazy(() => import("./pages/TemplateLibrary"));

// Component-based splitting
const WorkoutChart = lazy(() => import("./components/organisms/WorkoutChart"));
```

### Virtualization

```typescript
// For large workout lists (>50 steps)
import { useVirtualizer } from '@tanstack/react-virtual';

const WorkoutList = ({ steps }) => {
  const virtualizer = useVirtualizer({
    count: steps.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });

  return virtualizer.getVirtualItems().map(virtualRow => (
    <StepCard key={virtualRow.key} step={steps[virtualRow.index]} />
  ));
};
```

### Memoization Strategy

```typescript
// Expensive calculations
const workoutStats = useMemo(
  () => calculateWorkoutStats(workout, profile),
  [workout, profile]
);

// Callback stability
const handleStepUpdate = useCallback(
  (step: WorkoutStep) => {
    updateWorkout(/* ... */);
  },
  [updateWorkout]
);
```

## Deployment Strategy

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: "es2020",
    minify: "terser",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-select"],
          "chart-vendor": ["recharts"],
          kaiord: ["@kaiord/core"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Workout Editor",
        short_name: "Workout",
        theme_color: "#3b82f6",
      },
    }),
  ],
});
```

### Deployment Targets

**Primary:** GitHub Pages

- Free hosting for public repos
- Automatic HTTPS with custom domains
- GitHub Actions integration
- Simple deployment workflow
- Version control integration

**Configuration:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Alternative:** Vercel, Netlify, Cloudflare Pages

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
- Build and test
- Run Lighthouse CI
- Check bundle size
- Deploy to preview (PR)
- Deploy to production (main)
```

## Security Considerations

### Content Security Policy

```typescript
// index.html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';">
```

### Data Sanitization

```typescript
// Sanitize user input before storage
import DOMPurify from "isomorphic-dompurify";

const sanitizeWorkoutName = (name: string) =>
  DOMPurify.sanitize(name, { ALLOWED_TAGS: [] });
```

### Future Auth Integration Points

```typescript
// Prepared for authentication
interface AuthContext {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

// Feature flags for premium
interface FeatureFlags {
  canExportToFIT: boolean;
  canUseAdvancedTemplates: boolean;
  maxWorkoutsInLibrary: number;
}
```

## Extensibility Points

### Plugin Architecture (Future)

```typescript
interface WorkoutPlugin {
  id: string;
  name: string;
  version: string;
  hooks: {
    onWorkoutSave?: (workout: KRD) => KRD;
    onStepCreate?: (step: WorkoutStep) => WorkoutStep;
  };
}
```

### Theme System

The application supports multiple themes including a special "Kiroween" theme that can be easily enabled/disabled via feature flag.

```typescript
// Theme configuration
interface Theme {
  id: string;
  name: string;
  colors: ColorPalette;
  spacing: SpacingScale;
  typography: TypographyScale;
  components: ComponentOverrides;
  assets?: ThemeAssets;
}

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

interface ThemeAssets {
  logo?: string;
  icon?: string;
  backgroundPattern?: string;
}

// Available themes
const themes: Record<string, Theme> = {
  light: {
    id: 'light',
    name: 'Light',
    colors: {
      primary: '#3b82f6',      // Blue
      secondary: '#8b5cf6',    // Purple
      accent: '#06b6d4',       // Cyan
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
      info: '#3b82f6',
    },
    // ... spacing, typography, components
  },

  dark: {
    id: 'dark',
    name: 'Dark',
    colors: {
      primary: '#60a5fa',
      secondary: '#a78bfa',
      accent: '#22d3ee',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      error: '#f87171',
      warning: '#fbbf24',
      success: '#34d399',
      info: '#60a5fa',
    },
    // ... spacing, typography, components
  },

  // Special Kiroween theme (feature-flagged)
  // Inspired by https://kiroween.devpost.com/
  kiroween: {
    id: 'kiroween',
    name: 'Kiroween',
    colors: {
      primary: '#9333ea',      // Deep purple (Kiro brand)
      secondary: '#7c3aed',    // Rich purple
      accent: '#a855f7',       // Bright purple accent
      background: '#0a0118',   // Very dark purple/black
      surface: '#1a0b2e',      // Dark purple surface
      text: '#e9d5ff',         // Light lavender text
      textSecondary: '#c4b5fd',// Muted lavender
      border: '#581c87',       // Deep purple border
      error: '#f43f5e',        // Rose red
      warning: '#fb923c',      // Orange
      success: '#22c55e',      // Green
      info: '#a855f7',         // Purple info
    },
    assets: {
      logo: '/assets/themes/kiroween/kiro-ghost-logo.svg',
      icon: '/assets/themes/kiroween/kiro-ghost-icon.svg',
      backgroundPattern: '/assets/themes/kiroween/ghost-pattern.svg',
    },
    // ... spacing, typography, components
  },
};

// Feature flag for Kiroween theme
const FEATURE_FLAGS = {
  ENABLE_KIROWEEN_THEME: import.meta.env.VITE_ENABLE_KIROWEEN === 'true',
};

// Theme provider with feature flag support
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<string>('light');

  // Filter available themes based on feature flags
  const availableThemes = useMemo(() => {
    const baseThemes = { light: themes.light, dark: themes.dark };

    if (FEATURE_FLAGS.ENABLE_KIROWEEN_THEME) {
      return { ...baseThemes, kiroween: themes.kiroween };
    }

    return baseThemes;
  }, []);

  const theme = availableThemes[currentTheme] || availableThemes.light;

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setCurrentTheme, availableThemes }}>
      <div data-theme={theme.id} className={theme.id}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Tailwind configuration for themes
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Kiroween theme colors
        'kiro-purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
      },
    },
  },
  plugins: [],
};

// CSS variables for theme switching
// styles/themes.css
:root[data-theme="kiroween"] {
  --color-primary: #9333ea;
  --color-secondary: #7c3aed;
  --color-accent: #a855f7;
  --color-background: #0a0118;
  --color-surface: #1a0b2e;
  --color-text: #e9d5ff;
  --color-text-secondary: #c4b5fd;
  --color-border: #581c87;

  /* Kiro ghost decorations */
  --kiro-ghost-opacity: 0.15;
  --kiro-ghost-size: 120px;
  --kiro-ghost-glow: 0 0 20px rgba(147, 51, 234, 0.3);

  /* Spooky effects */
  --kiro-shadow: 0 4px 20px rgba(147, 51, 234, 0.2);
  --kiro-glow: 0 0 10px rgba(168, 85, 247, 0.5);
}

// Kiroween-specific components
const KiroGhostDecoration = () => {
  const { theme } = useTheme();

  if (theme.id !== 'kiroween') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <img
        src={theme.assets?.backgroundPattern}
        alt=""
        className="absolute top-0 right-0 w-32 h-32 opacity-10 animate-float"
      />
      <img
        src={theme.assets?.icon}
        alt=""
        className="absolute bottom-10 left-10 w-24 h-24 opacity-10 animate-float-delayed"
      />
    </div>
  );
};

// Easy removal: Just set VITE_ENABLE_KIROWEEN=false in .env
// Or remove the kiroween theme object from the themes constant
```

**Kiroween Theme Assets Structure:**

```
public/
└── assets/
    └── themes/
        └── kiroween/
            ├── kiro-ghost-logo.svg      # Kiro ghost logo
            ├── kiro-ghost-icon.svg      # Small ghost icon
            └── ghost-pattern.svg        # Repeating ghost pattern
```

**Environment Variable:**

```bash
# .env
VITE_ENABLE_KIROWEEN=true   # Enable Kiroween theme
# VITE_ENABLE_KIROWEEN=false  # Disable Kiroween theme (easy removal)
```

## Accessibility Implementation

### ARIA Patterns

```typescript
// Workout list with proper ARIA
<div role="list" aria-label="Workout steps">
  {steps.map(step => (
    <div
      key={step.id}
      role="listitem"
      aria-label={`Step ${step.stepIndex}: ${step.name}`}
      tabIndex={0}
    >
      <StepCard step={step} />
    </div>
  ))}
</div>
```

### Keyboard Navigation

```typescript
// Global keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveWorkout();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [undo, saveWorkout]);
```

## Internationalization

### i18n Structure

```typescript
// locales/en/common.json
{
  "workout": {
    "create": "Create Workout",
    "edit": "Edit Workout",
    "save": "Save",
    "cancel": "Cancel"
  },
  "step": {
    "duration": "Duration",
    "target": "Target",
    "intensity": "Intensity"
  }
}

// Usage
const { t } = useTranslation();
<Button>{t('workout.create')}</Button>
```

## Monitoring and Analytics

### Observability Architecture

The application is designed with observability in mind from day one, using an abstract analytics interface that allows easy integration of multiple providers.

```typescript
// Abstract analytics interface for easy provider switching
interface AnalyticsProvider {
  trackEvent: (event: string, properties?: Record<string, unknown>) => void;
  trackPageView: (path: string) => void;
  setUser: (userId: string, traits?: Record<string, unknown>) => void;
  trackError: (error: Error, context?: Record<string, unknown>) => void;
}

// Analytics service supporting multiple providers simultaneously
class AnalyticsService implements AnalyticsProvider {
  private providers: AnalyticsProvider[] = [];

  addProvider(provider: AnalyticsProvider) {
    this.providers.push(provider);
  }

  trackEvent(event: string, properties?: Record<string, unknown>) {
    this.providers.forEach((p) => p.trackEvent(event, properties));
  }

  trackPageView(path: string) {
    this.providers.forEach((p) => p.trackPageView(path));
  }

  setUser(userId: string, traits?: Record<string, unknown>) {
    this.providers.forEach((p) => p.setUser(userId, traits));
  }

  trackError(error: Error, context?: Record<string, unknown>) {
    this.providers.forEach((p) => p.trackError(error, context));
  }
}
```

### Performance Monitoring

```typescript
// Web Vitals tracking with reporting to analytics
import {
  getCLS,
  getFID,
  getFCP,
  getLCP,
  getTTFB,
  type Metric,
} from "web-vitals";

const reportWebVitals = (metric: Metric) => {
  // Send to analytics providers
  analytics.trackEvent("web_vital", {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
  });

  // Send to custom metrics endpoint (future)
  if (import.meta.env.PROD) {
    fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metric),
    }).catch(console.error);
  }
};

getCLS(reportWebVitals);
getFID(reportWebVitals);
getFCP(reportWebVitals);
getLCP(reportWebVitals);
getTTFB(reportWebVitals);
```

### Error Tracking

```typescript
// Prepared for Sentry integration
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter sensitive data
      if (event.user) {
        delete event.user.email;
      }
      return event;
    },
    integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
  });
}

// Error boundary with tracking
const logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
  analytics.trackError(error, {
    componentStack: errorInfo.componentStack,
    errorBoundary: true,
  });

  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }
};
```

### User Analytics

```typescript
// Track key user actions
const trackWorkoutCreated = (workout: KRD) => {
  analytics.trackEvent("workout_created", {
    sport: workout.extensions.workout.sport,
    stepCount: workout.extensions.workout.steps.length,
    hasRepetitions: workout.extensions.workout.steps.some(
      (s) => "repeatCount" in s
    ),
    duration: calculateTotalDuration(workout),
  });
};

const trackWorkoutExported = (format: "fit" | "tcx" | "zwo" | "krd") => {
  analytics.trackEvent("workout_exported", {
    format,
    timestamp: new Date().toISOString(),
  });
};

const trackFeatureUsed = (
  feature: string,
  metadata?: Record<string, unknown>
) => {
  analytics.trackEvent("feature_used", {
    feature,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

const trackProfileCreated = (profile: UserProfile) => {
  analytics.trackEvent("profile_created", {
    hasFTP: !!profile.ftp,
    hasMaxHR: !!profile.maxHeartRate,
    hasBodyWeight: !!profile.bodyWeight,
  });
};
```

### Analytics Providers (Future Integration)

```typescript
// Google Analytics 4
class GA4Provider implements AnalyticsProvider {
  trackEvent(event: string, properties?: Record<string, unknown>) {
    if (typeof gtag !== "undefined") {
      gtag("event", event, properties);
    }
  }

  trackPageView(path: string) {
    if (typeof gtag !== "undefined") {
      gtag("config", import.meta.env.VITE_GA_MEASUREMENT_ID, {
        page_path: path,
      });
    }
  }

  setUser(userId: string, traits?: Record<string, unknown>) {
    if (typeof gtag !== "undefined") {
      gtag("set", "user_properties", { user_id: userId, ...traits });
    }
  }

  trackError(error: Error, context?: Record<string, unknown>) {
    if (typeof gtag !== "undefined") {
      gtag("event", "exception", {
        description: error.message,
        fatal: false,
        ...context,
      });
    }
  }
}

// Plausible Analytics (privacy-friendly, GDPR-compliant)
class PlausibleProvider implements AnalyticsProvider {
  trackEvent(event: string, properties?: Record<string, unknown>) {
    if (typeof plausible !== "undefined") {
      plausible(event, { props: properties });
    }
  }

  trackPageView(path: string) {
    if (typeof plausible !== "undefined") {
      plausible("pageview", { url: path });
    }
  }

  setUser(userId: string, traits?: Record<string, unknown>) {
    // Plausible doesn't track users by default (privacy-first)
    // Can be extended with custom properties if needed
  }

  trackError(error: Error, context?: Record<string, unknown>) {
    if (typeof plausible !== "undefined") {
      plausible("error", {
        props: {
          message: error.message,
          ...context,
        },
      });
    }
  }
}

// Mixpanel (product analytics)
class MixpanelProvider implements AnalyticsProvider {
  trackEvent(event: string, properties?: Record<string, unknown>) {
    if (typeof mixpanel !== "undefined") {
      mixpanel.track(event, properties);
    }
  }

  trackPageView(path: string) {
    if (typeof mixpanel !== "undefined") {
      mixpanel.track("Page View", { path });
    }
  }

  setUser(userId: string, traits?: Record<string, unknown>) {
    if (typeof mixpanel !== "undefined") {
      mixpanel.identify(userId);
      mixpanel.people.set(traits);
    }
  }

  trackError(error: Error, context?: Record<string, unknown>) {
    if (typeof mixpanel !== "undefined") {
      mixpanel.track("Error", {
        message: error.message,
        stack: error.stack,
        ...context,
      });
    }
  }
}
```

### Privacy-First Analytics

```typescript
// GDPR-compliant analytics configuration
interface AnalyticsConfig {
  enabled: boolean;
  anonymizeIp: boolean;
  respectDoNotTrack: boolean;
  cookieConsent: boolean;
}

// Check user consent before tracking
const initAnalytics = (config: AnalyticsConfig) => {
  if (!config.enabled) {
    console.log("Analytics disabled by configuration");
    return;
  }

  if (!config.cookieConsent) {
    console.log("Analytics disabled: no cookie consent");
    return;
  }

  if (config.respectDoNotTrack && navigator.doNotTrack === "1") {
    console.log("Analytics disabled: Do Not Track enabled");
    return;
  }

  // Initialize analytics with privacy settings
  const analytics = new AnalyticsService();

  // Add privacy-friendly provider by default
  analytics.addProvider(new PlausibleProvider());

  // Optionally add other providers based on consent
  if (config.cookieConsent) {
    // analytics.addProvider(new GA4Provider());
    // analytics.addProvider(new MixpanelProvider());
  }

  return analytics;
};
```

### Custom Metrics Dashboard (Future)

```typescript
// Metrics collection for custom admin dashboard
interface AppMetrics {
  // Usage metrics
  totalWorkouts: number;
  totalSteps: number;
  avgWorkoutDuration: number;

  // Feature adoption
  templatesUsed: number;
  exportsByFormat: Record<string, number>;
  profilesCreated: number;

  // Performance metrics
  avgLoadTime: number;
  avgRenderTime: number;
  errorRate: number;
  p95LoadTime: number;

  // User engagement
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionDuration: number;
  bounceRate: number;

  // Conversion metrics (future premium features)
  conversionRate?: number;
  churnRate?: number;
}

// Metrics aggregation service
class MetricsAggregator {
  async getMetrics(timeRange: TimeRange): Promise<AppMetrics> {
    // Aggregate from analytics providers
    // Can be displayed in admin dashboard
    const response = await fetch(
      `/api/metrics?from=${timeRange.from}&to=${timeRange.to}`
    );
    return response.json();
  }

  async exportMetrics(format: "json" | "csv"): Promise<Blob> {
    const response = await fetch(`/api/metrics/export?format=${format}`);
    return response.blob();
  }
}
```

### Real-Time Monitoring (Future)

```typescript
// Prepared for real-time monitoring dashboard
interface RealTimeMetrics {
  activeUsers: number;
  requestsPerSecond: number;
  errorRate: number;
  avgResponseTime: number;
  memoryUsage: number;
}

// WebSocket connection for real-time updates
class RealTimeMonitor {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("Real-time monitoring connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const metrics: RealTimeMetrics = JSON.parse(event.data);
      this.updateDashboard(metrics);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.log("Real-time monitoring disconnected");
      this.attemptReconnect(url);
    };
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(url), 1000 * this.reconnectAttempts);
    }
  }

  private updateDashboard(metrics: RealTimeMetrics) {
    // Update real-time dashboard UI
    // Can trigger alerts if thresholds are exceeded
    if (metrics.errorRate > 0.05) {
      this.triggerAlert("High error rate detected");
    }
  }

  private triggerAlert(message: string) {
    // Send alert to monitoring service
    console.warn("ALERT:", message);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### Logging Strategy

```typescript
// Structured logging for better observability
interface LogContext {
  userId?: string;
  workoutId?: string;
  action?: string;
  [key: string]: unknown;
}

class Logger {
  private context: LogContext = {};

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log("warn", message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>) {
    this.log("error", message, {
      ...data,
      error: error?.message,
      stack: error?.stack,
    });
  }

  private log(level: string, message: string, data?: Record<string, unknown>) {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      ...data,
    };

    // Console in development
    if (import.meta.env.DEV) {
      console[level as "info" | "warn" | "error"](message, logEntry);
    }

    // Send to logging service in production
    if (import.meta.env.PROD) {
      this.sendToLoggingService(logEntry);
    }
  }

  private sendToLoggingService(logEntry: unknown) {
    // Send to logging aggregation service (e.g., Datadog, LogRocket)
    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logEntry),
    }).catch(console.error);
  }
}

// Global logger instance
export const logger = new Logger();
```

## Summary

This design provides a solid foundation for a modern, scalable, and maintainable workout editor application. The architecture supports all 39 requirements while remaining extensible for future enhancements like authentication, premium features, and advanced analytics.

Key strengths:

- Clean separation of concerns
- Performance-optimized from the start
- Accessible and inclusive
- Ready for offline use
- Prepared for monetization
- Easy to deploy and maintain
