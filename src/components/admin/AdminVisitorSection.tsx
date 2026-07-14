"use client";

import { useCallback, useEffect, useState } from "react";
import AdminVisitorPanel from "@/src/components/admin/AdminVisitorPanel";
import MarkSpammerButton from "@/src/components/admin/MarkSpammerButton";
import ModalSection from "@/src/components/admin/ModalSection";
import type { AdminCommentVisitor } from "@/src/types/admin/programComments";

type AdminVisitorSectionProps = {
  ipHash?: string;
  /** When false, only the stats panel is shown (no section wrapper / spam button). */
  showActions?: boolean;
  onSpammerChanged?: () => void | Promise<void>;
  className?: string;
};

export default function AdminVisitorSection({
  ipHash,
  showActions = true,
  onSpammerChanged,
  className = ""
}: AdminVisitorSectionProps) {
  const [visitor, setVisitor] = useState<AdminCommentVisitor | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const hash = ipHash?.trim();

  const fetchVisitor = useCallback(async () => {
    if (!hash) {
      setVisitor(undefined);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/visitor?hash=${encodeURIComponent(hash)}`);
      const json = await res.json();
      if (res.ok) {
        setVisitor((json.data as AdminCommentVisitor | null) ?? null);
      } else {
        console.error("visitor fetch", json);
        setVisitor(null);
      }
    } catch (e) {
      console.error(e);
      setVisitor(null);
    } finally {
      setLoading(false);
    }
  }, [hash]);

  useEffect(() => {
    fetchVisitor();
  }, [fetchVisitor]);

  async function handleSpammerChanged(nextIsSpammer: boolean) {
    setVisitor(prev => (prev ? { ...prev, isSpammer: nextIsSpammer } : prev));
    await fetchVisitor();
    await onSpammerChanged?.();
  }

  const panel = loading ? (
    <p className="text-sm text-gray-500">Loading visitor…</p>
  ) : (
    <AdminVisitorPanel ipHash={hash} visitor={visitor ?? undefined} />
  );

  if (!showActions) return panel;

  return (
    <ModalSection title="Visitor" color="green" className={`mb-0! ${className}`.trim()}>
      <div className="space-y-4">
        {panel}
        {hash ? (
          <div className="flex justify-end border-t border-green-200/80 pt-4">
            <MarkSpammerButton
              visitorHash={hash}
              isSpammer={visitor?.isSpammer === true}
              disabled={loading}
              onSuccess={handleSpammerChanged}
            />
          </div>
        ) : null}
      </div>
    </ModalSection>
  );
}
