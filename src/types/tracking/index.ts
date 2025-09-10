// Tracking and analytics related types
export type TrackingEvent = "copy_cdkey" | "download_click" | "social_click" | "page_viewed" | "report_expired_cdkey";

export interface TrackingEventData {
  _id: string;
  event: TrackingEvent;
  programSlug?: string;
  social?: string;
  path?: string;
  referrer?: string;
  country?: string;
  city?: string;
  keyMasked?: string;
  userAgent?: string;
  ipHash?: string;
  createdAt: string;
}

export interface TrackEventMeta {
  programSlug?: string;
  key?: unknown; // CDKey type
  path?: string;
  social?: string;
  copyMethod?: "button_click" | "keyboard_or_context_menu";
}

export interface TrackRequestBody {
  event: TrackingEvent;
  meta?: TrackEventMeta;
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
