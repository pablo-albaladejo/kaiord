/**
 * Check if the current process is running in a TTY (interactive terminal)
 *
 * @returns true if running in a TTY, false otherwise
 */
export const isTTY = (): boolean => {
  return process.stdout.isTTY === true;
};
