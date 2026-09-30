import { lazy } from "react";

export const AthletePage = lazy(() => import("./components/pages/AthletePage"));
export const ChatPage = lazy(() => import("./components/pages/ChatPage"));
export const CalendarPage = lazy(
  () => import("./components/pages/CalendarPage")
);
export const DailyPage = lazy(() => import("./components/pages/Daily"));
export const NutritionPage = lazy(() => import("./components/pages/Nutrition"));
export const LibraryPage = lazy(() => import("./components/pages/LibraryPage"));
export const ConvertPage = lazy(() => import("./components/pages/ConvertPage"));
export const EditorPage = lazy(() => import("./components/pages/EditorPage"));
export const WorkoutDetail = lazy(
  () => import("./components/pages/WorkoutDetail/WorkoutDetail")
);
export const CreateWorkout = lazy(
  () => import("./components/pages/CreateWorkout/CreateWorkout")
);
export const SettingsPage = lazy(
  () => import("./components/pages/SettingsPage/SettingsPage")
);
// Route dispatchers kept out of the entry graph: both only render lazy pages,
// so loading them eagerly just adds their import chains to the initial JS.
export const HealthSubRouter = lazy(() =>
  import("./components/pages/health/health-routes").then((m) => ({
    default: m.HealthSubRouter,
  }))
);
export const NewWorkoutRoute = lazy(() =>
  import("./new-workout-route").then((m) => ({ default: m.NewWorkoutRoute }))
);
