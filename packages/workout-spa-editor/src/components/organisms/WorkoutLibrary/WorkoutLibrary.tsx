/**
 * WorkoutLibrary Component
 *
 * Grid view of saved workouts with search, filter, and sort capabilities.
 *
 * Requirements:
 * - Requirement 17: Save workouts to library
 * - Requirement 18: Load workouts from library
 */

import * as Dialog from "@radix-ui/react-dialog";
import {
  Calendar,
  Clock,
  Filter,
  Search,
  SortAsc,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLibraryStore } from "../../../store/library-store";
import type { WorkoutTemplate } from "../../../types/workout-library";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";

// ============================================
// Types
// ============================================

export type WorkoutLibraryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadWorkout: (template: WorkoutTemplate) => void;
  hasCurrentWorkout?: boolean;
};

type SortOption = "date" | "name" | "duration";
type SortDirection = "asc" | "desc";

// ============================================
// Component
// ============================================

export const WorkoutLibrary: React.FC<WorkoutLibraryProps> = ({
  open,
  onOpenChange,
  onLoadWorkout,
  hasCurrentWorkout = false,
}) => {
  const { templates, deleteTemplate, getAllTags } = useLibraryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Array<string>>([]);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<WorkoutTemplate | null>(null);
  const [loadConfirmTemplate, setLoadConfirmTemplate] =
    useState<WorkoutTemplate | null>(null);

  const allTags = getAllTags();

  // Filter and sort workouts
  const filteredAndSortedWorkouts = useMemo(() => {
    let filtered = templates;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(query));
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((t) =>
        selectedTags.every((tag) => t.tags.includes(tag))
      );
    }

    // Sort workouts
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "duration":
          comparison = (a.duration ?? 0) - (b.duration ?? 0);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [templates, searchQuery, selectedTags, sortBy, sortDirection]);

  // Handle tag toggle
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(option);
      setSortDirection("desc");
    }
  };

  // Handle load workout
  const handleLoadWorkout = (template: WorkoutTemplate) => {
    if (hasCurrentWorkout) {
      setLoadConfirmTemplate(template);
    } else {
      confirmLoadWorkout(template);
    }
  };

  // Confirm load workout
  const confirmLoadWorkout = (template: WorkoutTemplate) => {
    onLoadWorkout(template);
    setLoadConfirmTemplate(null);
    onOpenChange(false);
  };

  // Handle delete workout
  const handleDelete = (templateId: string) => {
    setDeleteConfirmId(templateId);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteTemplate(deleteConfirmId);
      setDeleteConfirmId(null);
      if (previewTemplate?.id === deleteConfirmId) {
        setPreviewTemplate(null);
      }
    }
  };

  // Format duration
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-full max-w-6xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
              Workout Library
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-gray-950"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Browse and load your saved workouts.
          </Dialog.Description>

          {/* Search and Filter Bar */}
          <div className="mb-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workouts by name..."
                className="pl-10"
                aria-label="Search workouts"
              />
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tags:
                </span>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-primary-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                    aria-pressed={selectedTags.includes(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Sort by:
              </span>
              <div className="flex gap-2">
                {(["date", "name", "duration"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSortChange(option)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      sortBy === option
                        ? "bg-primary-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                    aria-pressed={sortBy === option}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                    {sortBy === option && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Workout Grid */}
          {filteredAndSortedWorkouts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {templates.length === 0
                  ? "No workouts saved yet. Create and save a workout to get started."
                  : "No workouts match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedWorkouts.map((template) => (
                <div
                  key={template.id}
                  className="group relative rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-primary-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-500"
                  data-testid="workout-card"
                >
                  {/* Thumbnail */}
                  {template.thumbnailData && (
                    <div className="mb-3 aspect-video overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
                      <img
                        src={template.thumbnailData}
                        alt={`${template.name} preview`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="mb-3">
                    <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.sport}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="mb-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(template.createdAt)}</span>
                    </div>
                    {template.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(template.duration)}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Difficulty */}
                  {template.difficulty && (
                    <div className="mb-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          template.difficulty === "easy"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : template.difficulty === "moderate"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                              : template.difficulty === "hard"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {template.difficulty.replace("_", " ")}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleLoadWorkout(template)}
                      className="flex-1"
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDelete(template.id)}
                      aria-label="Delete workout"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredAndSortedWorkouts.length} of {templates.length}{" "}
            workouts
          </div>

          {/* Delete Confirmation Dialog */}
          {deleteConfirmId && (
            <Dialog.Root
              open={!!deleteConfirmId}
              onOpenChange={(open) => !open && setDeleteConfirmId(null)}
            >
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-gray-200 bg-white p-6 shadow-lg sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Workout
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete this workout? This action
                    cannot be undone.
                  </Dialog.Description>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={confirmDelete}>Delete</Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}

          {/* Load Confirmation Dialog */}
          {loadConfirmTemplate && (
            <Dialog.Root
              open={!!loadConfirmTemplate}
              onOpenChange={(open) => !open && setLoadConfirmTemplate(null)}
            >
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-gray-200 bg-white p-6 shadow-lg sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    Replace Current Workout?
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Loading this workout will replace your current workout. Any
                    unsaved changes will be lost. Are you sure you want to
                    continue?
                  </Dialog.Description>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setLoadConfirmTemplate(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => confirmLoadWorkout(loadConfirmTemplate)}
                    >
                      Load Workout
                    </Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}

          {/* Preview Dialog */}
          {previewTemplate && (
            <Dialog.Root
              open={!!previewTemplate}
              onOpenChange={(open) => !open && setPreviewTemplate(null)}
            >
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto border border-gray-200 bg-white p-6 shadow-lg sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      {previewTemplate.name}
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-gray-950"
                        aria-label="Close preview"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </Dialog.Close>
                  </div>

                  {/* Preview Content */}
                  <div className="space-y-4">
                    {previewTemplate.thumbnailData && (
                      <div className="aspect-video overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
                        <img
                          src={previewTemplate.thumbnailData}
                          alt={`${previewTemplate.name} preview`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div>
                      <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Details
                      </h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-600 dark:text-gray-400">
                            Sport:
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-white">
                            {previewTemplate.sport}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600 dark:text-gray-400">
                            Created:
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-white">
                            {formatDate(previewTemplate.createdAt)}
                          </dd>
                        </div>
                        {previewTemplate.duration && (
                          <div className="flex justify-between">
                            <dt className="text-gray-600 dark:text-gray-400">
                              Duration:
                            </dt>
                            <dd className="font-medium text-gray-900 dark:text-white">
                              {formatDuration(previewTemplate.duration)}
                            </dd>
                          </div>
                        )}
                        {previewTemplate.difficulty && (
                          <div className="flex justify-between">
                            <dt className="text-gray-600 dark:text-gray-400">
                              Difficulty:
                            </dt>
                            <dd className="font-medium text-gray-900 dark:text-white">
                              {previewTemplate.difficulty.replace("_", " ")}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {previewTemplate.notes && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Notes
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {previewTemplate.notes}
                        </p>
                      </div>
                    )}

                    {previewTemplate.tags.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {previewTemplate.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => {
                          setPreviewTemplate(null);
                          handleLoadWorkout(previewTemplate);
                        }}
                        className="flex-1"
                      >
                        Load Workout
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setPreviewTemplate(null)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
