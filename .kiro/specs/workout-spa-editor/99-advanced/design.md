# Design Document - Workout SPA Editor Advanced Features

## Overview

This document describes the design for advanced features that extend the Workout SPA Editor beyond the core MVP and enhanced features (v1.0.0 and v1.1.0). These features are planned for v1.2.0 and beyond, focusing on user profiles, workout libraries, onboarding, advanced workout types, performance optimization, and accessibility enhancements.

## Architecture

### High-Level Architecture

The advanced features follow the same clean architecture principles as the core application:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Profile   │  │  Library   │  │ Onboarding │            │
│  │    UI      │  │     UI     │  │     UI     │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          ↓ uses
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Profile   │  │  Library   │  │   Help     │            │
│  │   Store    │  │   Store    │  │  Context   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          ↓ uses
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Profile   │  │  Library   │  │  Service   │            │
│  │  Storage   │  │  Storage   │  │   Worker   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### User Profile Components

**ProfileManager Component:**

```typescript
interface ProfileManagerProps {
  profiles: UserProfile[];
  activeProfileId: string | null;
  onCreateProfile: (profile: UserProfile) => void;
  onUpdateProfile: (id: string, updates: Partial<UserProfile>) => void;
  onDeleteProfile: (id: string) => void;
  onSwitchProfile: (id: string) => void;
  onExportProfile: (id: string) => void;
  onImportProfile: (file: File) => void;
}
```

**ZoneEditor Component:**

```typescript
interface ZoneEditorProps {
  profile: UserProfile;
  zoneType: "power" | "heartRate";
  onSave: (zones: PowerZone[] | HRZone[]) => void;
  onCancel: () => void;
}
```

### Workout Library Components

**WorkoutLibrary Component:**

```typescript
interface WorkoutLibraryProps {
  workouts: WorkoutLibraryItem[];
  onLoadWorkout: (id: string) => void;
  onDeleteWorkout: (id: string) => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (tags: string[]) => void;
}
```

**SaveToLibraryButton Component:**

```typescript
interface SaveToLibraryButtonProps {
  workout: KRD;
  onSave: (item: WorkoutLibraryItem) => void;
}
```

### Onboarding Components

**OnboardingTutorial Component:**

```typescript
interface OnboardingTutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement: string; // CSS selector
  position: "top" | "bottom" | "left" | "right";
}
```

## Data Models

### UserProfile

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

### WorkoutLibraryItem

```typescript
interface WorkoutLibraryItem {
  id: string;
  name: string;
  sport: string;
  subSport?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  thumbnail?: string; // Base64 encoded image
  krd: KRD; // Full KRD object
}
```

## State Management

### Profile Store (Zustand)

```typescript
interface ProfileStore {
  // State
  profiles: UserProfile[];
  activeProfileId: string | null;

  // Actions
  createProfile: (profile: UserProfile) => void;
  updateProfile: (id: string, updates: Partial<UserProfile>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  exportProfile: (id: string) => Blob;
  importProfile: (data: unknown) => void;

  // Selectors
  getActiveProfile: () => UserProfile | null;
  getProfileById: (id: string) => UserProfile | undefined;
}
```

### Library Store (Zustand)

```typescript
interface LibraryStore {
  // State
  workouts: WorkoutLibraryItem[];
  searchQuery: string;
  selectedTags: string[];

  // Actions
  addWorkout: (item: WorkoutLibraryItem) => void;
  updateWorkout: (id: string, updates: Partial<WorkoutLibraryItem>) => void;
  deleteWorkout: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;

  // Selectors
  getFilteredWorkouts: () => WorkoutLibraryItem[];
  getWorkoutById: (id: string) => WorkoutLibraryItem | undefined;
  getAllTags: () => string[];
}
```

## Storage Strategy

### LocalStorage vs IndexedDB

**LocalStorage** (for small data):

- User profiles (<1MB)
- Preferences
- Onboarding state

**IndexedDB** (for large data):

- Workout library (potentially >10MB)
- Workout thumbnails
- Cached workout files

### Storage Utilities

```typescript
// Profile storage
export const profileStorage = {
  save: async (profiles: UserProfile[]): Promise<void> => {
    localStorage.setItem("profiles", JSON.stringify(profiles));
  },

  load: async (): Promise<UserProfile[]> => {
    const data = localStorage.getItem("profiles");
    return data ? JSON.parse(data) : [];
  },

  export: (profile: UserProfile): Blob => {
    return new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
  },

  import: async (file: File): Promise<UserProfile> => {
    const text = await file.text();
    const data = JSON.parse(text);
    return profileSchema.parse(data);
  },
};

// Library storage (IndexedDB)
export const libraryStorage = {
  save: async (item: WorkoutLibraryItem): Promise<void> => {
    const db = await openDB("workout-library", 1);
    await db.put("workouts", item);
  },

  load: async (): Promise<WorkoutLibraryItem[]> => {
    const db = await openDB("workout-library", 1);
    return await db.getAll("workouts");
  },

  delete: async (id: string): Promise<void> => {
    const db = await openDB("workout-library", 1);
    await db.delete("workouts", id);
  },
};
```

## Performance Optimization

### Virtual Scrolling

For large workout lists (>50 steps) and library views (>100 workouts):

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualWorkoutList = ({ workouts }: { workouts: WorkoutLibraryItem[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: workouts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated item height
    overscan: 5, // Render 5 items above/below viewport
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <WorkoutCard workout={workouts[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Service Worker for Offline Support

```typescript
// service-worker.ts
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache workout files
registerRoute(
  ({ request }) => request.destination === "document",
  new NetworkFirst({
    cacheName: "workouts",
    networkTimeoutSeconds: 3,
  })
);

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new CacheFirst({
    cacheName: "api-cache",
  })
);
```

## Accessibility Enhancements

### Screen Reader Announcements

```typescript
// hooks/useScreenReaderAnnouncements.ts
export const useScreenReaderAnnouncements = () => {
  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", priority);
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = message;

      document.body.appendChild(announcement);

      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    },
    []
  );

  return { announce };
};
```

### High Contrast Mode

```typescript
// contexts/ThemeContext.tsx
interface ThemeContextValue {
  theme: "light" | "dark" | "high-contrast";
  setTheme: (theme: "light" | "dark" | "high-contrast") => void;
}

const highContrastColors = {
  background: "#000000",
  text: "#FFFFFF",
  primary: "#FFFF00",
  border: "#FFFFFF",
  focus: "#00FFFF",
};
```

## Testing Strategy

### Unit Tests

- Profile store actions and selectors
- Library store search and filter logic
- Zone calculation utilities
- Storage utilities (mock localStorage/IndexedDB)
- Coverage target: 80%+

### Component Tests

- ProfileManager component rendering and interactions
- ZoneEditor component validation
- WorkoutLibrary search and filter UI
- Onboarding tutorial navigation
- Coverage target: 70%+

### Integration Tests

- Complete profile creation and switching flow
- Save to library and load from library flow
- Onboarding tutorial completion flow
- Profile import/export flow

### E2E Tests

- Create profile → Configure zones → Switch profiles
- Save workout to library → Search → Load workout
- First-time user onboarding flow
- Offline functionality with service worker

### Performance Tests

- Virtual scrolling with >100 workouts
- Profile switching performance
- Library search performance
- Service worker cache performance

## Summary

The advanced features design maintains the same clean architecture principles as the core application while adding powerful functionality for user profiles, workout libraries, onboarding, and performance optimization. All features are designed with accessibility, testability, and performance in mind.
