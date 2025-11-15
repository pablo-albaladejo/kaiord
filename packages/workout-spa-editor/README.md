# @kaiord/workout-spa-editor

A mobile-first single-page application for creating, editing, and managing KRD workout files.

## Features

- Visual workout editor with drag-and-drop support
- Real-time validation
- User profile management with training zones
- Workout library with local storage
- Export to FIT/TCX/PWX formats
- PWA support for offline usage
- Responsive design optimized for mobile devices

## Tech Stack

- **React 19** - UI framework
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool and dev server
- **@kaiord/core** - Core KRD types, schemas, and conversion utilities
- **Zustand 5** - State management (to be added)
- **Zod 3** - Schema validation (to be added)
- **Tailwind CSS 4** - Utility-first CSS framework (to be added)
- **Radix UI** - Accessible component primitives (to be added)
  - Dialog, Dropdown Menu, Select, Tabs, Toast, Tooltip, Switch, Slider
- **Prettier 3** - Code formatting

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
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

## Project Structure

```
src/
├── components/
│   ├── atoms/       # Basic building blocks (Button, Input, etc.)
│   ├── molecules/   # Simple combinations (FormField, StepCard, etc.)
│   ├── organisms/   # Complex components (WorkoutList, StepEditor, etc.)
│   └── templates/   # Page layouts
├── hooks/           # Custom React hooks
├── store/           # Zustand state management
├── types/           # TypeScript type definitions
├── pages/           # Route components
└── styles/          # Global styles and themes
```

## Configuration

- **TypeScript**: Strict mode enabled with path aliases (`@/*` → `src/*`)
- **ESLint**: Configured with React, TypeScript, and project-specific rules
- **Prettier**: Consistent code formatting
- **Vite**: Optimized build configuration with code splitting

## Requirements

- Node.js >= 20.0.0
- npm or pnpm

## License

MIT
