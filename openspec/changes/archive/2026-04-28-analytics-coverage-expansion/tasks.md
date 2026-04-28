## 1. SPA Route Tracking

- [x] 1.1 In `App.tsx`, add `useLocation` import from `wouter` and add a `useEffect` that calls `analytics.pageView(path)` whenever `path` changes (covers initial mount and all client-side navigations)
- [x] 1.2 Add a test to `App.test.tsx` (or a new `App.analytics.test.tsx`) verifying that `analytics.pageView` is called on mount and on route change

## 2. File Import Tracking

- [x] 2.1 Add optional `onImported?: (format: string) => void` to `UseFileUploadProps` in `useFileUpload.ts`
- [x] 2.2 Thread `onImported` through `useFileUploadActions` → `createFileChangeHandler` in `file-upload-handlers.ts`; call it after `onFileLoad(krd)` using `detectFormat(file.name)` (already imported in `SuccessStatus.tsx`, add import to handlers)
- [x] 2.3 Add `onImported` prop to `FileUpload.tsx` component and pass it to `useFileUpload`
- [x] 2.4 In `EditorNewWorkout.tsx`, call `useAnalytics()` and pass `(format) => analytics.event('workout-imported', { format })` as `onImported` to `<FileUpload>`
- [x] 2.5 In `ManualCreateSection.tsx`, call `useAnalytics()` and pass `(format) => analytics.event('workout-imported', { format })` as `onImported` to `<FileUpload>`
- [x] 2.6 Add a test verifying `workout-imported` is fired with correct format on successful import and NOT fired on failure

## 3. Manual Workout Creation Tracking

- [x] 3.1 In `EditorNewWorkout.tsx`, wrap `handleCreateWorkout` to call `analytics.event('workout-created', { source: 'manual' })` on successful save
- [x] 3.2 Add a test verifying `workout-created` fires when a manual workout is saved

## 4. Route Error Tracking

- [x] 4.1 Add optional `analytics?: Analytics` prop to `RouteErrorBoundary` (import `Analytics` type from `@kaiord/core`)
- [x] 4.2 In `componentDidCatch`, call `this.props.analytics?.event('route-error', { route: window.location.pathname })` before the existing `console.error`
- [x] 4.3 In `App.tsx`, pass `analytics` (from `useAnalytics()`) to each `<RouteErrorBoundary>` instance
- [x] 4.4 Add a test verifying `route-error` is fired when a child component throws

## 5. Verification

- [x] 5.1 Run `pnpm -r test && pnpm -r build && pnpm lint:fix` — zero errors, zero warnings
- [x] 5.2 Open the editor in a browser with DevTools → Network → filter `rum`; navigate between routes and verify each navigation fires a POST to `/cdn-cgi/rum`
