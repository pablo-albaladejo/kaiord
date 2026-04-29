---
name: frontend-patterns
description: Read this guideline when working on workout-spa-editor, React components, custom hooks, Zustand store, Dexie queries, or generating GCN workout targets.
---

# Frontend Patterns — Kaiord

## SPA state management routing

| State type                                                               | Tool                            | Rule                 |
| ------------------------------------------------------------------------ | ------------------------------- | -------------------- |
| Editor runtime (undo/redo, selection, clipboard)                         | Zustand (`workout-store`)       | Never auto-persisted |
| Persisted data (workouts, templates, profiles, AI providers, sync state) | Dexie + `useLiveQuery`          | One query per page   |
| Ephemeral UI (modals, spinners) and shared runtime (bridge status)       | React `useState` / `useContext` | —                    |

**Rule:** "Editor runtime → Zustand. Persisted data → Dexie. Local UI → React state."

## Generic components

Generic components MUST use the port/adapter pattern — never import platform-specific stores directly. A component that could be reused across contexts must receive data and callbacks via props, not by importing Zustand or Dexie internals.

## GCN targets — never use zoneNumber

`zoneNumber` maps to Garmin's **default** zones, not the user's custom zones. This causes NaN display in the Garmin Connect UI for pace and wrong zone values for HR and power.

**Always use explicit `targetValueOne` / `targetValueTwo`** with the zone's actual values (bpm, m/s, watts).

```typescript
// WRONG
{ targetType: 'pace', zone: { zoneNumber: 2 } }

// CORRECT
{ targetType: 'pace', targetValueOne: 2.54, targetValueTwo: 2.86 }
```

This applies to all target types: pace, heart rate, and power.
