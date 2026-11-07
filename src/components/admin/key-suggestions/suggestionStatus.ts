/** @fileoverview Key suggestion statuses for the admin list and details. */
import { pillTones } from "@/src/components/admin/list/AdminListKit";
import type { KeySuggestion } from "@/src/types/contact";

export const SUGGESTION_STATUS_OPTIONS: Array<{ value: KeySuggestion["status"]; label: string }> = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "added", label: "Added" },
  { value: "rejected", label: "Rejected" }
];

export const SUGGESTION_STATUS_TONES: Record<KeySuggestion["status"], string> = {
  new: pillTones.blue,
  reviewing: pillTones.amber,
  added: pillTones.green,
  rejected: pillTones.gray
};
