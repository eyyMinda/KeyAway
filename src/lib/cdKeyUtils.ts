import { CDKey } from "@/src/types/ProgramType";

/**
 * Checks if a CD key should be automatically expired based on its validUntil date
 * @param cdKey - The CD key to check
 * @returns A new CD key object with updated status if needed
 */
export const checkAndUpdateKeyStatus = (cdKey: CDKey): CDKey => {
  const now = new Date();
  const validUntil = new Date(cdKey.validUntil);

  // If the key is not already expired and the validUntil date has passed
  if (cdKey.status.toLowerCase() !== "expired" && now > validUntil) {
    return { ...cdKey, status: "expired" };
  }

  return cdKey;
};

/**
 * Processes an array of CD keys to automatically expire them if needed
 * @param cdKeys - Array of CD keys to process
 * @returns Array of processed CD keys with updated statuses
 */
export const processCdKeys = (cdKeys: CDKey[]): CDKey[] => {
  return cdKeys.map(checkAndUpdateKeyStatus);
};

/**
 * Gets the status color class for a CD key status
 * @param status - The status string
 * @returns CSS class string for the status color
 */
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "new":
      return "bg-primary-500 text-white";
    case "active":
      return "bg-success-500 text-white";
    case "limit":
      return "bg-warning-500 text-white";
    case "expired":
      return "bg-error-500 text-white";
    default:
      return "bg-primary-500 text-white";
  }
};

/**
 * Sorts CD keys by status priority
 * @param cdKeys - Array of CD keys to sort
 * @returns Sorted array of CD keys
 */
export const sortCdKeysByStatus = (cdKeys: CDKey[]): CDKey[] => {
  const statusOrder: Record<string, number> = { new: 0, active: 1, limit: 2, expired: 3 };

  return [...cdKeys].sort(
    (a: CDKey, b: CDKey) => (statusOrder[a.status?.toLowerCase()] ?? 4) - (statusOrder[b.status?.toLowerCase()] ?? 4)
  );
};

/**
 * Checks if a CD key is about to expire within the next 24 hours
 * @param cdKey - The CD key to check
 * @returns True if the key expires within 24 hours
 */
export const isKeyExpiringSoon = (cdKey: CDKey): boolean => {
  const now = new Date();
  const validUntil = new Date(cdKey.validUntil);
  const hoursUntilExpiry = (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0 && cdKey.status.toLowerCase() !== "expired";
};

/**
 * Gets the time remaining until a key expires
 * @param cdKey - The CD key to check
 * @returns Object with days, hours, and minutes remaining
 */
export const getTimeUntilExpiry = (cdKey: CDKey): { days: number; hours: number; minutes: number } => {
  const now = new Date();
  const validUntil = new Date(cdKey.validUntil);
  const diffMs = validUntil.getTime() - now.getTime();

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
};
