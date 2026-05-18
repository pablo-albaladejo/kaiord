type DialogHeaderProps = {
  profileName?: string;
  onNameChange?: (name: string) => void;
};

export function DialogHeader({ profileName, onNameChange }: DialogHeaderProps) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Profile Manager
        </h2>
      </div>

      {profileName !== undefined && onNameChange && (
        <input
          type="text"
          value={profileName}
          onChange={(e) => onNameChange(e.target.value)}
          aria-label="Profile name"
          className="mb-4 w-full border-b border-transparent bg-transparent text-base font-medium text-gray-900 hover:border-gray-300 focus:border-blue-500 focus:outline-none dark:text-white dark:hover:border-gray-600 dark:focus:border-blue-400"
        />
      )}

      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Manage your training profiles with zones and personal data.
      </p>
    </>
  );
}
