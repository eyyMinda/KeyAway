export type NotificationType = "new_program" | "new_keys";

export interface Notification {
  id: string;
  type: NotificationType;
  programSlug: string;
  programTitle: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
  keysCount?: number;
  keyStatus?: "new" | "active";
}
