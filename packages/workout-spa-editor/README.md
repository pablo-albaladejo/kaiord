# @kaiord/workout-spa-editor

A mobile-first single-page application for creating, editing, and managing KRD (Kaiord Representation Definition) workout files. Built with React, TypeScript, and modern web technologies.

## ✨ Features

### P0 + P1 Complete (MVP)

The application has a fully functional MVP with all core features:

- ✅ **Visual Workout Editor** - View and edit workout structure with intuitive UI
- ✅ **File Operations** - Load, edit, and save KRD workout files
- ✅ **Step Management** - Create, edit, delete, and duplicate workout steps
- ✅ **Real-time Validation** - Instant feedback with Zod schema validation
- ✅ **Workout Statistics** - Calculate total duration, distance, and more
- ✅ **Undo/Redo** - Full history management with 50-state limit
- ✅ **Error Handling** - Comprehensive error messages and recovery
- ✅ **Responsive Design** - Mobile-first, works on all screen sizes
- ✅ **Accessibility** - WCAG 2.1 AA compliant with keyboard navigation
- ✅ **Component Documentation** - Full Storybook coverage
- ✅ **Comprehensive Testing** - Unit tests (86.5% coverage) + E2E tests (Playwright)
- ✅ **CI/CD Pipeline** - Automated testing and deployment to GitHub Pages

### Coming Soon (P2+)

- 🔄 Drag-and-drop step reordering
- 👤 User profiles with training zones
- 📚 Workout library with local storage
- 📤 Export to FIT/TCX/ZWO formats
- 🎨 Theme system (light/dark modes)
- 🌍 Internationalization (i18n)
- 📱 PWA support for offline usage

## Tech Stack

- **React 19** - UI framework
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool and dev server
- **@kaiord/core** - Core KRD types, schemas, and conversion utilities
- **Zustand 5** - State management
- **Zod 3** - Schema validation
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
  - Dialog, Dropdown Menu, Select, Tabs, Toast, Tooltip, Switch, Slider
- **Storybook 10** - Component documentation and development
- **Vitest 3** - Unit testing framework
- **Playwright 1** - E2E testing framework
- **Prettier 3** - Code formatting

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20.x or higher
- **pnpm**: Version 9.x or higher (install with `npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone https://github.com/pablo-albaladejo/kaiord.git
cd kaiord

# Install dependencies (from workspace root)
pnpm install

# Navigate to the SPA editor package
cd packages/workout-spa-editor
```

### Development

```bash
# Start dev server (http://localhost:5173)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Testing

```bash
# Run unit tests (Vitest)
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run unit tests with UI
pnpm test:ui

# Run E2E tests (Playwright)
pnpm test:e2e

# Run E2E tests in UI mode (interactive)
pnpm test:e2e:ui

# Run E2E tests in debug mode
pnpm test:e2e:debug

# View E2E test report
pnpm test:e2e:report

# Install Playwright browsers (first time only)
pnpm test:e2e:install
```

### Component Documentation

```bash
# Run Storybook (http://localhost:6006)
pnpm storybook

# Build Storybook for deployment
pnpm build-storybook
```

### Code Quality

```bash
# Lint code (ESLint + Prettier)
pnpm lint

# Fix linting and formatting issues
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check code formatting
pnpm format:check

# Clean build artifacts
pnpm clean
```

## 📁 Project Structure

The project follows **Atomic Design** principles for component organization:

```
packages/workout-spa-editor/
├── src/
│   ├── components/
│   │   ├── atoms/           # Basic building blocks
│   │   │   ├── Badge/       # Status badges with color variants
│   │   │   ├── Button/      # Primary UI button component
│   │   │   ├── ErrorMessage/# Error display component
│   │   │   ├── Icon/        # Icon wrapper (lucide-react)
│   │   │   └── Input/       # Form input component
│   │   ├── molecules/       # Simple combinations
│   │   │   ├── DeleteConfirmDialog/  # Confirmation dialog
│   │   │   ├── DurationPicker/       # Duration input component
│   │   │   ├── FileUpload/           # File upload component
│   │   │   ├── SaveButton/           # Save with loading state
│   │   │   ├── SaveErrorDialog/      # Save error display
│   │   │   ├── StepCard/             # Workout step card
│   │   │   └── TargetPicker/         # Target input component
│   │   ├── organisms/       # Complex components
│   │   │   ├── StepEditor/           # Step editing form
│   │   │   ├── WorkoutList/          # List of workout steps
│   │   │   └── WorkoutStats/         # Workout statistics panel
│   │   ├── templates/       # Page layouts
│   │   │   └── MainLayout/           # Main application layout
│   │   └── pages/           # Page components
│   │       ├── WelcomeSection/       # Welcome/file upload page
│   │       └── WorkoutSection/       # Main workout editor page
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand state management
│   │   ├── actions/         # Store action creators
│   │   ├── workout-actions.ts  # Workout manipulation actions
│   │   ├── workout-selectors.ts # Store selectors
│   │   └── workout-store.ts    # Main Zustand store
│   ├── types/               # TypeScript type definitions
│   │   └── schemas/         # Zod validation schemas
│   ├── utils/               # Utility functions
│   │   ├── formatters.ts    # Data formatting utilities
│   │   ├── helpers.ts       # General helper functions
│   │   ├── save-workout.ts  # File save utilities
│   │   ├── validation.ts    # Validation utilities
│   │   └── workout-stats/   # Workout statistics calculation
│   ├── test-utils/          # Testing utilities
│   │   └── fixtures.ts      # Test data factories
│   ├── App.tsx              # Root application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles (Tailwind)
├── e2e/                     # Playwright E2E tests
│   ├── workout-load-edit-save.spec.ts
│   ├── workout-creation.spec.ts
│   ├── mobile-responsive.spec.ts
│   └── accessibility.spec.ts
├── .storybook/              # Storybook configuration
├── public/                  # Static assets
├── playwright.config.ts     # Playwright configuration
├── vitest.config.ts         # Vitest configuration
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## 🏗️ Architecture

### State Management (Zustand)

The application uses **Zustand** for lightweight, performant state management:

- **Centralized store** - Single source of truth for workout data
- **Undo/Redo** - Full history management with 50-state limit
- **Selectors** - Optimized state access with memoization
- **Actions** - Pure functions for state updates

Key store features:

- `currentWorkout` - Active workout being edited
- `workoutHistory` - Undo/redo history stack
- `selectedStepId` - Currently selected step
- `isEditing` - Editor state flag

### Component Architecture (Atomic Design)

Components are organized by complexity:

1. **Atoms** - Basic building blocks (Button, Input, Badge, Icon)
2. **Molecules** - Simple combinations (StepCard, DurationPicker, TargetPicker)
3. **Organisms** - Complex components (WorkoutList, StepEditor, WorkoutStats)
4. **Templates** - Page layouts (MainLayout)
5. **Pages** - Route components (WelcomeSection, WorkoutSection)

### Data Flow

```
User Action → Component → Store Action → State Update → Re-render
                                ↓
                         Validation (Zod)
                                ↓
                         Error Handling
```

### Validation Strategy

All data validation uses **Zod schemas** from `@kaiord/core`:

- **At boundaries** - Validate file uploads and user inputs
- **Real-time** - Instant feedback during editing
- **Type-safe** - TypeScript types inferred from schemas
- **Comprehensive** - All KRD format requirements enforced

## ♿ Accessibility

The Workout SPA Editor is designed to be accessible to all users, including those using assistive technologies. The application is **WCAG 2.1 AA compliant** and has been thoroughly tested for accessibility.

### Keyboard Navigation

All features are fully accessible via keyboard:

- **Tab / Shift+Tab** - Navigate between interactive elements
- **Enter / Space** - Activate buttons and select items
- **Escape** - Close dialogs and cancel editing
- **Ctrl+Z / Cmd+Z** - Undo last action
- **Ctrl+Y / Cmd+Y** - Redo last undone action
- **Ctrl+S / Cmd+S** - Save workout

### Screen Reader Support

- All interactive elements have proper ARIA labels
- Semantic HTML structure for clear navigation
- Form fields have associated labels
- Error messages are clearly identified
- Landmark regions for easy navigation

### Visual Accessibility

- High contrast color scheme
- Visible focus indicators on all interactive elements
- Responsive text sizing
- Clear visual hierarchy
- Color is not the sole means of conveying information

### Standards Compliance

- **WCAG 2.1 AA** compliant
- Tested with keyboard navigation
- Semantic HTML throughout
- Proper ARIA attributes
- Focus management for dialogs and modals

### Accessibility Testing

Accessibility is validated through:

- **Automated E2E tests** - Playwright accessibility suite
- **Manual keyboard navigation** - All features tested
- **Component-level tests** - ARIA attributes validated
- **Continuous integration** - Accessibility checks in CI/CD pipeline

For accessibility issues or suggestions, please [open an issue](https://github.com/pablo-albaladejo/kaiord/issues) on GitHub.

## 🧪 Testing

### Test Coverage

Current test coverage: **86.5%** (target: 70%)

- **Test Files**: 29 passing
- **Total Tests**: 380 passing
- **Coverage by Area**:
  - Store/State Management: 99.12%
  - Type Guards & Validation: 100%
  - Atoms: 90%+
  - Molecules: 60-70%
  - Organisms: 40-75%
  - Utils: 93.58%

### Testing Stack

- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright (Chromium, Firefox, WebKit)
- **Component Docs**: Storybook with a11y addon
- **Coverage**: @vitest/coverage-v8

### Test Types

1. **Unit Tests** - Component behavior and logic
2. **Integration Tests** - Component interactions
3. **E2E Tests** - Complete user flows
4. **Accessibility Tests** - WCAG 2.1 AA compliance
5. **Mobile Tests** - Responsive design validation

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## 🚢 Deployment

### GitHub Pages

The application is automatically deployed to GitHub Pages on every push to `main`:

- **Workflow**: `.github/workflows/deploy-spa-editor.yml`
- **Build**: Vite production build with optimizations
- **Base Path**: Automatically configured for GitHub Pages
- **Deployment**: Automated via GitHub Actions

### Manual Deployment

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Deploy to GitHub Pages (automatic on push to main)
git push origin main
```

### Build Configuration

- **Minification**: Terser for optimal bundle size
- **Source Maps**: Enabled for debugging
- **Target**: ES2020 for modern browser support
- **Code Splitting**: Automatic chunk optimization

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow code style** - ESLint + Prettier enforced
3. **Write tests** - Maintain 70%+ coverage
4. **Update documentation** - Keep README and inline comments current
5. **Submit a PR** - Clear description and reference to issues

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed guidelines.

### Development Guidelines

- **TypeScript Strict Mode** - No `any` types without justification
- **Atomic Design** - Follow component organization patterns
- **Test-Driven Development** - Write tests before implementation
- **Accessibility First** - WCAG 2.1 AA compliance required
- **Mobile-First** - Responsive design for all screen sizes

## 📚 Documentation

- **[TESTING.md](./TESTING.md)** - Testing infrastructure and guidelines
- **[Storybook](http://localhost:6006)** - Component documentation (run `pnpm storybook`)
- **[Requirements](./.kiro/specs/workout-spa-editor/requirements.md)** - Feature requirements
- **[Design](./.kiro/specs/workout-spa-editor/design.md)** - Architecture and design decisions
- **[Tasks](./.kiro/specs/workout-spa-editor/tasks.md)** - Implementation plan

## 🛠️ Configuration

### TypeScript

- **Strict mode** enabled for maximum type safety
- **Path aliases**: `@/*` → `src/*`
- **Target**: ES2020
- **Module**: ESNext

### ESLint

- React + TypeScript rules
- React Hooks rules
- React Refresh rules
- Custom project rules

### Prettier

- Consistent code formatting
- Integrated with ESLint
- Auto-format on save (recommended)

### Vite

- Fast HMR (Hot Module Replacement)
- Optimized production builds
- Code splitting and tree shaking
- Source maps for debugging

### Tailwind CSS

- Utility-first CSS framework
- Custom design tokens
- Responsive design utilities
- Dark mode support (coming soon)

## 📦 Dependencies

### Core Dependencies

- **React 19** - UI framework with concurrent features
- **TypeScript 5** - Type safety and developer experience
- **Vite 7** - Fast build tool and dev server
- **@kaiord/core** - KRD types, schemas, and utilities
- **Zustand 5** - Lightweight state management
- **Zod 3** - Schema validation and type inference

### UI Components

- **Radix UI** - Accessible component primitives
  - Dialog, Dropdown Menu, Select, Tabs, Toast, Tooltip, Switch, Slider
- **Tailwind CSS 4** - Utility-first CSS framework
- **lucide-react** - Icon library

### Development Tools

- **Vitest 3** - Unit testing framework
- **Playwright 1** - E2E testing framework
- **Storybook 10** - Component documentation
- **ESLint 9** - Code linting
- **Prettier 3** - Code formatting

## 🔧 Requirements

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0 (recommended) or npm

## 📄 License

MIT - See [LICENSE](../../LICENSE) for details

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [@kaiord/core](../core)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
