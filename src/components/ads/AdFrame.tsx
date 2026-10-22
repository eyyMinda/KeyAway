"use client";

/**
 * @fileoverview Wrapper every ad placement renders through. Units inside report whether an ad rendered; when all
 * of them come back empty (ad blocker, no fill) the frame collapses, label included, instead of leaving a gap.
 * It also tells units which placement id to record their stats under.
 */
import { createContext, useCallback, useMemo, useState, type CSSProperties, type ReactNode } from "react";

export type AdFillStatus = "loading" | "filled" | "unfilled";

type AdFrameContextValue = {
  placement: string;
  setUnitStatus: (unitId: string, status: AdFillStatus | null) => void;
};

export const AdFrameContext = createContext<AdFrameContextValue | null>(null);

type AdFrameProps = {
  placement: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export default function AdFrame({ placement, className = "", style, children }: AdFrameProps) {
  const [statuses, setStatuses] = useState<Record<string, AdFillStatus>>({});

  const setUnitStatus = useCallback((unitId: string, status: AdFillStatus | null) => {
    setStatuses(prev => {
      if (status === null) {
        if (!(unitId in prev)) return prev;
        const next = { ...prev };
        delete next[unitId];
        return next;
      }
      return prev[unitId] === status ? prev : { ...prev, [unitId]: status };
    });
  }, []);

  const context = useMemo(() => ({ placement, setUnitStatus }), [placement, setUnitStatus]);
  const values = Object.values(statuses);
  const collapsed = values.length > 0 && values.every(status => status === "unfilled");

  return (
    <AdFrameContext.Provider value={context}>
      <aside
        aria-label="Advertisement"
        aria-hidden={collapsed || undefined}
        className={className}
        style={collapsed ? { ...style, display: "none" } : style}>
        {children}
      </aside>
    </AdFrameContext.Provider>
  );
}
