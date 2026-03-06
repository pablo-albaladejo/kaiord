# @kaiord/workout-spa-editor

A mobile-first single-page application for creating, editing, and managing KRD (Kaiord Representation Definition) workout files. Built with React, TypeScript, and modern web technologies.

**Live Demo**: [https://pablo-albaladejo.github.io/kaiord/](https://pablo-albaladejo.github.io/kaiord/)

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

### AI Workout Generation

- **Natural language input** - Describe a workout in plain text and generate a structured KRD workout
- **Multi-provider support** - Anthropic (Claude), OpenAI (GPT), Google (Gemini) via Vercel AI SDK
- **Training zone context** - Automatically injects your profile zones into the LLM prompt
- **Custom system prompts** - Add global instructions for all AI generations

### Garmin Connect Integration

- **Push to Garmin** - Send workouts directly to your Garmin Connect account
- **Self-hostable proxy** - Uses a Lambda endpoint (configurable, self-host with `@kaiord/infra`)
- **Credential management** - Encrypted storage for Garmin credentials

### Settings Panel

- **AI tab** - Manage LLM providers (add/remove/edit), set default, custom prompt
- **Garmin tab** - Configure Garmin credentials and Lambda endpoint URL
- **Privacy tab** - Disclaimers, self-hosting guide, clear all credentials

### Sport-Specific Training Zones

- **Per-sport zone configs** - Separate HR, power, and pace zones for Cycling, Running, Swimming, and Generic
- **Auto/manual modes** - Auto-calculate zones from thresholds (LTHR, FTP, threshold pace) or set manually
- **Zone editor** - Tabbed UI in Profile Manager for editing sport-specific zones
- **AI zone context** - Zone indicator in AI workout form; formatter sends sport-specific zones to LLM
- **Pace zones** - mm:ss format for running (min/km) and swimming (min/100m)
- **Profile migration** - Legacy profiles auto-migrate to the sport-zones structure

### Coming Soon (P2+)

- PWA support for offline usage
- Internationalization (i18n)

## Tech Stack

- **React 19** - UI framework
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool and dev server
- **@kaiord/core** - Core KRD types, schemas, and conversion utilities
- **Zustand 5** - State management
- **Zod 3** - Schema validation
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Storybook 10** - Component documentation and development
- **Vitest 3** - Unit testing framework
- **Playwright 1** - E2E testing framework

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

# Measure E2E test flakiness (100 runs)
pnpm test:e2e:flakiness

# Quick flakiness test (10 runs)
pnpm test:e2e:flakiness:quick

# iOS flakiness test (100 runs on Mobile Safari)
pnpm test:e2e:flakiness:ios
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

## Documentation

### Main Documentation

- **[Getting Started](../../docs/getting-started.md)** - Quick start guide
- **[Architecture](../../docs/architecture.md)** - Component architecture and state management
- **[Testing Guidelines](../../docs/testing.md)** - Testing patterns and best practices
- **[Deployment Guide](../../docs/deployment.md)** - Deployment process and troubleshooting

### Package-Specific Documentation

- **[Block ID System](./docs/block-id-system.md)** - Block identification and migration system
- **[Repetition Block Deletion](./docs/repetition-block-deletion.md)** - Block deletion feature documentation
- **[Keyboard Shortcuts](./docs/keyboard-shortcuts.md)** - Complete keyboard navigation guide
- **[Modal System](./docs/modal-system.md)** - Confirmation modal system documentation
- **[Performance Optimization](./docs/performance-optimization.md)** - Performance testing and optimization guide
- **[Delete Button Styling](./docs/delete-button-styling-comparison.md)** - Button styling consistency documentation

## 🔧 Requirements

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0 (recommended) or npm

## 📄 License

MIT - See [LICENSE](../../LICENSE) for details
