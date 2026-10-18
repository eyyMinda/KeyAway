"use client";

import { useSyncExternalStore } from "react";
import {
  getAdConsentServerSnapshot,
  getAdConsentSnapshot,
  subscribeAdConsent,
  type AdConsentSnapshot
} from "@/src/lib/consent/adConsent";

export function useAdConsent(): AdConsentSnapshot {
  return useSyncExternalStore(subscribeAdConsent, getAdConsentSnapshot, getAdConsentServerSnapshot);
}
