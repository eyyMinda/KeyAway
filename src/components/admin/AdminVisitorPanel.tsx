"use client";

import { visitorTierBadgeClasses } from "@/src/theme/colorSchema";
import type { AdminCommentVisitor } from "@/src/types/admin/programComments";

type AdminVisitorPanelProps = {
  ipHash?: string;
  visitor?: AdminCommentVisitor;
};

function Stat({
  label,
  value,
  className = ""
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white px-3 py-2 ${className}`.trim()}>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

export default function AdminVisitorPanel({ ipHash, visitor }: AdminVisitorPanelProps) {
  if (!ipHash?.trim()) {
    return <p className="text-sm text-gray-500">No visitor hash recorded.</p>;
  }

  const tier = visitor?.visitTier ?? "new";
  const isSpam = visitor?.isSpammer === true;
  const location = [visitor?.city, visitor?.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={visitorTierBadgeClasses(tier, false)}>{tier}</span>
        {isSpam ? <span className={visitorTierBadgeClasses("new", true)}>spammer</span> : null}
      </div>
      <p className="font-mono text-xs text-gray-500 break-all">{ipHash}</p>
      {visitor ? (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          <Stat label="Visits" value={visitor.visitCount ?? 0} className="sm:col-span-2" />
          <Stat label="Reports" value={visitor.reportCount ?? 0} className="sm:col-span-2" />
          <Stat label="Comments" value={visitor.commentCount ?? 0} className="sm:col-span-2" />
          <Stat label="Suggestions" value={visitor.suggestionCount ?? 0} className="sm:col-span-3" />
          <Stat label="Contribution" value={visitor.contributionScore ?? 0} className="col-span-2 sm:col-span-3" />
          <Stat label="Location" value={location || "—"} className="sm:col-span-3" />
          <Stat
            label="Last active"
            className="sm:col-span-3"
            value={
              visitor.lastActivityAt
                ? new Date(visitor.lastActivityAt).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short"
                  })
                : "—"
            }
          />
        </dl>
      ) : (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          No visitor document in Sanity for this hash yet.
        </p>
      )}
    </div>
  );
}
