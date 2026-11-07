/** @fileoverview Contact message statuses for the admin list and details. */
import { pillTones } from "@/src/components/admin/list/AdminListKit";
import type { ContactMessage } from "@/src/types/contact";

export const MESSAGE_STATUS_OPTIONS: Array<{ value: ContactMessage["status"]; label: string }> = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" }
];

export const MESSAGE_STATUS_TONES: Record<ContactMessage["status"], string> = {
  new: pillTones.blue,
  read: pillTones.gray,
  replied: pillTones.green,
  archived: pillTones.purple
};
