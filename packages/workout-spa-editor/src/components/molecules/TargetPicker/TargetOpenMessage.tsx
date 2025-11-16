type TargetOpenMessageProps = {
  error?: string;
};

export const TargetOpenMessage = ({ error }: TargetOpenMessageProps) => {
  return (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Open target (no specific intensity goal)
      </p>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </>
  );
};
