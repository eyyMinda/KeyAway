// Analytics tracking types
export type AnalyticsEvent = "copy_cdkey" | "download_click" | "social_click" | "page_viewed" | "facebook_group_click";

// Key report types
export type KeyReportEvent = "report_key_working" | "report_key_expired" | "report_key_limit_reached";

export interface AnalyticsEventData {
  _id: string;
  event: AnalyticsEvent;
  programSlug?: string;
  social?: string;
  path?: string;
  referrer?: string;
  country?: string;
  city?: string;
  keyHash?: string;
  keyIdentifier?: string;
  keyNormalized?: string;
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
  keyHash: string;
  keyIdentifier: string;
  keyNormalized: string;
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
  key?: unknown; // CDKey type
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
  key: string;
}

export interface DuplicateCheckResponse {
  ok: boolean;
  isDuplicate: boolean;
  existingReport?: {
    _id: string;
    eventType: KeyReportEvent;
    programSlug: string;
    keyHash: string;
    keyIdentifier: string;
    createdAt: string;
  };
  error?: string;
}

export interface RenewReportRequest {
  reportId: string;
  newEventType: KeyReportEvent;
  programSlug: string;
  key: string;
}

export interface RenewReportResponse {
  ok: boolean;
  updatedReport?: {
    _id: string;
    eventType: KeyReportEvent;
    programSlug: string;
    keyHash: string;
    keyIdentifier: string;
    createdAt: string;
  };
  error?: string;
}

// Geolocation types
export interface LocationData {
  country?: string;
  city?: string;
}

// Analytics aggregation types
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
