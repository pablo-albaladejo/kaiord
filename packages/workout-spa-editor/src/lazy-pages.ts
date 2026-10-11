import { lazyPage } from "./lazy-page";

export const AthletePage = lazyPage(
  () => import("./components/pages/AthletePage")
);
export const ChatPage = lazyPage(() => import("./components/pages/ChatPage"));
export const CalendarPage = lazyPage(
  () => import("./components/pages/CalendarPage")
);
export const DailyPage = lazyPage(() => import("./components/pages/Daily"));
export const NutritionPage = lazyPage(
  () => import("./components/pages/Nutrition")
);
export const LibraryPage = lazyPage(
  () => import("./components/pages/LibraryPage")
);
export const ConvertPage = lazyPage(
  () => import("./components/pages/ConvertPage")
);
export const EditorPage = lazyPage(
  () => import("./components/pages/EditorPage")
);
export const WorkoutDetail = lazyPage(
  () => import("./components/pages/WorkoutDetail/WorkoutDetail")
);
export const CreateWorkout = lazyPage(
  () => import("./components/pages/CreateWorkout/CreateWorkout")
);
export const SettingsPage = lazyPage(
  () => import("./components/pages/SettingsPage/SettingsPage")
);
// Route dispatchers kept out of the entry graph: both only render lazy pages,
// so loading them eagerly just adds their import chains to the initial JS.
export const HealthSubRouter = lazyPage(() =>
  import("./components/pages/health/health-routes").then((m) => ({
    default: m.HealthSubRouter,
  }))
);
export const NewWorkoutRoute = lazyPage(() =>
  import("./new-workout-route").then((m) => ({ default: m.NewWorkoutRoute }))
);
