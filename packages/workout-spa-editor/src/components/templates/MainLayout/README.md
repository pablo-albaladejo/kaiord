# MainLayout

Main application layout template providing consistent structure across all pages.

## Features

- **Sticky Header**: Fixed header with app branding
- **Responsive Design**: Mobile-first approach with breakpoints
- **Content Container**: Centered content with max-width constraint
- **Dark Mode Support**: Automatic theme switching
- **Accessibility**: Semantic HTML and ARIA labels

## Usage

```tsx
import { MainLayout } from "@/components/templates/MainLayout/MainLayout";

function App() {
  return (
    <MainLayout>
      <h2>Page Content</h2>
      <p>Your page content goes here</p>
    </MainLayout>
  );
}
```

## Props

| Prop       | Type        | Required | Description                    |
| ---------- | ----------- | -------- | ------------------------------ |
| `children` | `ReactNode` | Yes      | Content to render in main area |

## Layout Structure

```text
┌─────────────────────────────────────┐
│ Header (sticky)                     │
│ - Logo + Title                      │
│ - Navigation (future)               │
├─────────────────────────────────────┤
│                                     │
│ Main Content Area                   │
│ (children rendered here)            │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

## Responsive Behavior

- **Mobile (< 640px)**: Full-width with minimal padding
- **Tablet (640px - 1024px)**: Increased padding
- **Desktop (> 1024px)**: Max-width container with optimal padding

## Requirements

Implements:

- **Requirement 1**: Clear visual format for workout structure
- **Requirement 8**: Mobile-first responsive design with touch-friendly interface

## Future Enhancements

- Profile selector in header
- Theme toggle button
- Breadcrumb navigation
- Footer with links and version info
