"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { PublicVisitorContext } from "@/src/lib/visitors/publicVisitorContext";

export type ProgramVisitorState = PublicVisitorContext & {
  /** True until the first `/api/v1/visitor/context` response (success or failure). */
  isLoading: boolean;
};

const defaultState: ProgramVisitorState = {
  isSpammer: false,
  visitorHint: null,
  isLoading: true
};

const ProgramVisitorContext = createContext<ProgramVisitorState>(defaultState);

export function useProgramVisitor(): ProgramVisitorState {
  return useContext(ProgramVisitorContext);
}

async function fetchVisitorContext(): Promise<PublicVisitorContext> {
  const res = await fetch("/api/v1/visitor/context", { credentials: "same-origin" });
  if (!res.ok) return { isSpammer: false, visitorHint: null };
  const json = (await res.json()) as { data?: PublicVisitorContext };
  return json.data ?? { isSpammer: false, visitorHint: null };
}

/** Call before opening report UI so spammer state is ready when the modal renders. */
export function prefetchProgramVisitorContext(): void {
  if (typeof window === "undefined") return;
  void fetchVisitorContext().catch(() => undefined);
}

export function ProgramVisitorProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<ProgramVisitorState>(defaultState);
  const loadedRef = useRef(false);

  const applyContext = useCallback((data: PublicVisitorContext) => {
    loadedRef.current = true;
    setCtx({ ...data, isLoading: false });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchVisitorContext();
        if (!cancelled) applyContext(data);
      } catch {
        if (!cancelled) applyContext({ isSpammer: false, visitorHint: null });
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [applyContext]);

  return <ProgramVisitorContext.Provider value={ctx}>{children}</ProgramVisitorContext.Provider>;
}
