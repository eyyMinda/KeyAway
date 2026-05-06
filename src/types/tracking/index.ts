/**
 * @fileoverview Client tracking payloads, Sanity-shaped events, and related request/response types.
 */

export type AnalyticsEvent =
  | "copy_cdkey"
  | "copy_pro_account"
  | "click_activation_link"
  | "download_click"
  | "social_click"
  | "page_viewed";

export type KeyReportEvent = "report_key_working" | "report_key_expired" | "report_key_limit_reached";

export interface AnalyticsEventData {
  _id: string;
  event: AnalyticsEvent;
  programSlug?: string;
  /** `page_viewed` only: true when the URL was not found or program slug was invalid. */
  notFound?: boolean;
  /** From `visitor` by `ipHash` (admin queries only). */
  visitTier?: string;
  visitorIsSpammer?: boolean;
  social?: string;
  path?: string;
  referrer?: string;
  country?: string;
  city?: string;
  /** Row id or normalized copy payload (see `programFlow` / `activationUrl` when relevant). */
  key?: string;
  activationUrl?: string;
  programFlow?: string;
  userAgent?: string;
  ipHash?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  createdAt: string;
}

export interface KeyReportData {
  _id: string;
  eventType: KeyReportEvent;
  programSlug: string;
  key: string;
  label?: string;
  path?: string;
  referrer?: string;
  country?: string;
  city?: string;
  userAgent?: string;
  ipHash?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  createdAt: string;
}

export interface TrackEventMeta {
  programSlug?: string;
  /** When true, stored on `page_viewed` as not-found traffic (no program slug). */
  notFound?: boolean;
  key?: unknown; // CDKey type
  programFlow?: string;
  /** For `click_activation_link`: which URL was opened / interacted with. */
  activationUrl?: string;
  clickButton?: "left" | "right" | "aux";
  path?: string;
  social?: string;
  copyMethod?: "button_click" | "keyboard_or_context_menu";
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface TrackRequestBody {
  event: AnalyticsEvent | KeyReportEvent;
  meta?: TrackEventMeta;
}

export interface DuplicateCheckRequest {
  programSlug: string;
  /** Raw key string, activation identity string, or `CDKey`-shaped object (use with `programFlow`). */
  key: string | Record<string, unknown>;
  programFlow?: string;
}

export interface DuplicateCheckResponse {
  ok: boolean;
  isDuplicate: boolean;
  existingReport?: {
    _id: string;
    eventType: KeyReportEvent;
    programSlug: string;
    key: string;
    label?: string;
    createdAt: string;
  };
  error?: string;
}

export interface RenewReportRequest {
  reportId: string;
  newEventType: KeyReportEvent;
  programSlug: string;
  key: string | Record<string, unknown>;
}

export interface RenewReportResponse {
  ok: boolean;
  updatedReport?: {
    _id: string;
    eventType: KeyReportEvent;
    programSlug: string;
    key: string;
    label?: string;
    createdAt: string;
  };
  error?: string;
}

export interface LocationData {
  country?: string;
  city?: string;
}

export interface EventAggregation {
  byEvent: Map<string, number>;
  byProgram: Map<string, number>;
  bySocial: Map<string, number>;
  byCountry: Map<string, number>;
  byReferrer: Map<string, number>;
  byPath: Map<string, number>;
  uniquePaths: Set<string>;
  uniquePrograms: Set<string>;
}
