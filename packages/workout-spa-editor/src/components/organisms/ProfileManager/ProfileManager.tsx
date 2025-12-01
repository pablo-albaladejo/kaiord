/**
 * ProfileManager Component
 *
 * Manages user profiles with create, edit, delete, and import/export functionality.
 *
 * Requirements:
 * - Requirement 9: User profile management with training zones
 * - Requirement 38: Profile import/export functionality
 */

import * as Dialog from "@radix-ui/react-dialog";
import { ProfileManagerDialog } from "./components/ProfileManagerDialog";
import { useProfileManager } from "./useProfileManager";

export type ProfileManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  open,
  onOpenChange,
}) => {
  const managerState = useProfileManager();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
          <ProfileManagerDialog {...managerState} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
