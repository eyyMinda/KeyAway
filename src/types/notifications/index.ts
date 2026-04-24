export type NotificationType = "new_program" | "new_program_with_keys" | "new_keys";

export interface Notification {
  id: string;
  type: NotificationType;
  programSlug: string;
  programTitle: string;
  /** key line only, e.g. "2 keys added"; omit for `new_program` (NEW tag + title only). */
  message?: string;
  createdAt: string;
  imageUrl?: string;
}
