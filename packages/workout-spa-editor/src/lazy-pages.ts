import { lazy } from "react";

export const AthletePage = lazy(() => import("./components/pages/AthletePage"));
export const ChatPage = lazy(() => import("./components/pages/ChatPage"));
export const CalendarPage = lazy(
  () => import("./components/pages/CalendarPage")
);
export const DailyPage = lazy(() => import("./components/pages/Daily"));
export const LibraryPage = lazy(() => import("./components/pages/LibraryPage"));
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
