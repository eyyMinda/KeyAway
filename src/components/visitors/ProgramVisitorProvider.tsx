"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { PublicVisitorContext } from "@/src/lib/visitors/publicVisitorContext";

export type ProgramVisitorState = PublicVisitorContext & {
  /** True until the first `/api/v1/visitor/context` response (success or failure). */
  isLoading: boolean;
};

const STORAGE_KEY = "keyaway:visitor-context:v1";

const defaultState: ProgramVisitorState = {
  isSpammer: false,
  visitorHint: null,
  isLoading: true
};

const ProgramVisitorContext = createContext<ProgramVisitorState>(defaultState);

export function useProgramVisitor(): ProgramVisitorState {
  return useContext(ProgramVisitorContext);
}

function readCachedContext(): PublicVisitorContext | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicVisitorContext;
    if (typeof parsed?.isSpammer !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedContext(data: PublicVisitorContext): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // private mode
  }
}

let inflight: Promise<PublicVisitorContext> | null = null;

async function fetchVisitorContext(): Promise<PublicVisitorContext> {
  const cached = readCachedContext();
  if (cached) return cached;
  if (!inflight) {
    inflight = fetch("/api/v1/visitor/context", { credentials: "same-origin" })
      .then(async res => {
        if (!res.ok) throw new Error("visitor context");
        const json = (await res.json()) as { data?: PublicVisitorContext };
        return json.data ?? { isSpammer: false, visitorHint: null };
      })
      .then(data => {
        writeCachedContext(data);
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Call before opening report UI so spammer state is ready when the modal renders. */
export function prefetchProgramVisitorContext(): void {
  if (typeof window === "undefined") return;
  void fetchVisitorContext().catch(() => undefined);
}

export function ProgramVisitorProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<ProgramVisitorState>(defaultState);

  const applyContext = useCallback((data: PublicVisitorContext) => {
    setCtx({ ...data, isLoading: false });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = readCachedContext();
    if (cached) {
      applyContext(cached);
      return;
    }

    void fetchVisitorContext()
      .then(data => {
        if (!cancelled) applyContext(data);
      })
      .catch(() => {
        if (!cancelled) applyContext({ isSpammer: false, visitorHint: null });
      });

    return () => {
      cancelled = true;
    };
  }, [applyContext]);

  return <ProgramVisitorContext.Provider value={ctx}>{children}</ProgramVisitorContext.Provider>;
}
