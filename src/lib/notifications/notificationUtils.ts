import { CDKeyStatus } from "@/src/lib/program/cdKeyUtils";

// Notification Duration Constants
export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000
} as const;

// Report Status Messages
export const REPORT_STATUS_MESSAGES: Record<CDKeyStatus, string> = {
  working: "Key reported as working. Thank you!",
  expired: "Key reported as expired. Thank you!",
  limit_reached: "Key reported as limit reached. Thank you!"
};

// Renewal Status Messages
export const RENEWAL_STATUS_MESSAGES: Record<CDKeyStatus, string> = {
  working: "Key report renewed as working. Thank you!",
  expired: "Key report renewed as expired. Thank you!",
  limit_reached: "Key report renewed as limit reached. Thank you!"
};

// Error Messages
export const ERROR_MESSAGES = {
  REPORT_FAILED: "Failed to report key status. Please try again.",
  RENEWAL_FAILED: "Failed to renew key report. Please try again.",
  DUPLICATE_CHECK_FAILED: "Failed to check for duplicate report.",
  COPY_FAILED: "Failed to copy key",
  GENERIC_ERROR: "An error occurred. Please try again."
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  KEY_COPIED: "Key copied to clipboard!",
  COPIED: (value: string) => `Copied ${value} to clipboard!`,
  REPORT_SUBMITTED: "Report submitted successfully!",
  RENEWAL_COMPLETED: "Report renewed successfully!"
} as const;

// Info Messages
export const INFO_MESSAGES = {
  DUPLICATE_FOUND: "You've already reported this key",
  CHECKING_DUPLICATE: "Checking for previous reports...",
  RENEWAL_INSTRUCTIONS: "You can renew your report to update the status and timestamp",
  REPORT_INSTRUCTIONS: "Your feedback helps us maintain accurate key statuses"
} as const;

/** Report / renew modals when `isSpammerVisitor` — full sentence, second person. */
export const SPAMMER_REPORT_RESTRICTION_NOTICE =
  "Because your recent reports were marked as spam, you can no longer report keys as expired or limit reached. You can still report them as working.";

/** `title` on disabled Expired / Limit reached actions (keep short). */
export const SPAMMER_REPORT_DISABLED_OPTION_TITLE = "Not available — your recent reports were flagged as spam.";

// Get report status message
export function getReportStatusMessage(status: CDKeyStatus): string {
  return REPORT_STATUS_MESSAGES[status];
}

// Get renewal status message
export function getRenewalStatusMessage(status: CDKeyStatus): string {
  return RENEWAL_STATUS_MESSAGES[status];
}

// Get error message
export function getErrorMessage(key: keyof typeof ERROR_MESSAGES): string {
  return ERROR_MESSAGES[key];
}

// Get success message
export function getSuccessMessage(key: keyof typeof SUCCESS_MESSAGES, arg?: string): string {
  const v = SUCCESS_MESSAGES[key];
  return typeof v === "function" ? v(arg ?? "") : v;
}

// Get info message
export function getInfoMessage(key: keyof typeof INFO_MESSAGES): string {
  return INFO_MESSAGES[key];
}
