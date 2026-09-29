/**
 * @fileoverview Central duration constants and helpers.
 * Prefer these over inline `n * 24 * 60 * 60 * 1000` / `864e5` math so windows are
 * defined once and read as `THIRTY_DAYS_MS` / `days(30)` everywhere.
 */

/* ---- Base units (ms) ---- */
export const SECOND_MS = 1000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
export const WEEK_MS = 7 * DAY_MS;

/* ---- Multipliers ---- */
export const seconds = (n: number): number => n * SECOND_MS;
export const minutes = (n: number): number => n * MINUTE_MS;
export const hours = (n: number): number => n * HOUR_MS;
export const days = (n: number): number => n * DAY_MS;
export const weeks = (n: number): number => n * WEEK_MS;

/* ---- Common named windows ---- */
export const SEVEN_DAYS_MS = days(7);
export const THIRTY_DAYS_MS = days(30);
export const SIXTY_DAYS_MS = days(60);
export const NINETY_DAYS_MS = days(90);

/** ISO timestamp for a point `ms` before `from` (defaults to now). */
export const isoSince = (ms: number, from: number = Date.now()): string => new Date(from - ms).toISOString();
