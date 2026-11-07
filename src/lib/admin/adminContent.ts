/**
 * @fileoverview Sanity reads for admin pages, run on the server with the dataset token. The dataset is private, so
 * the browser cannot query it; admin pages fetch these through /api/v1/admin/content/[view].
 */
import { adminKeyReportProgramsQuery } from "@/src/lib/sanity/queries";

export const ADMIN_CONTENT_QUERIES = {
  keyReportPrograms: adminKeyReportProgramsQuery,
  messages: `*[_type == "contactMessage"] | order(createdAt desc) {
  _id,
  _createdAt,
  title,
  message,
  name,
  email,
  ipHash,
  status,
  createdAt,
  lastRepliedAt,
  replies[]{
    _key,
    body,
    subject,
    sentTo,
    sentBy,
    sentAt,
    resendId
  }
}`,
  keySuggestions: `*[_type == "keySuggestion"] | order(createdAt desc) {
        _id, _createdAt, cdKey, programName, programVersion, programLink, name, email, message, status, ipHash, createdAt,
        lastRepliedAt, replies[]{ _key, body, subject, sentTo, sentBy, sentAt, resendId }
      }`
} as const;

export type AdminContentView = keyof typeof ADMIN_CONTENT_QUERIES;

export const isAdminContentView = (view: string): view is AdminContentView => view in ADMIN_CONTENT_QUERIES;

/** Browser helper for admin pages: GET a named view, throwing on failure. */
export async function fetchAdminContent<T>(view: AdminContentView): Promise<T> {
  const res = await fetch(`/api/v1/admin/content/${view}`);
  if (!res.ok) throw new Error(`Could not load ${view} (${res.status})`);
  return ((await res.json()) as { data: T }).data;
}
