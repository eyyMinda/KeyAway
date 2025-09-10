"use client";

import { CDKeyItemProps } from "@/src/types";
import CDKeyActions from "@/src/components/program/cdkeys/CDKeyActions";
import { getStatusColor } from "@/src/lib/cdKeyUtils";
import { useCopyTracking } from "@/src/hooks/useCopyTracking";

export default function CDKeyItem({ cdKey, index, slug, reportCount }: CDKeyItemProps) {
  const isDisabled = cdKey.status === "limit" || cdKey.status === "expired";

  useCopyTracking({ cdKey, slug });

  return (
    <tr key={index} className={`hover:bg-neutral-700 transition-colors ${isDisabled ? "opacity-50" : ""}`}>
      <td className="px-6 py-4 text-nowrap">
        <code
          className={`px-3 py-1 rounded-lg text-sm font-mono select-text ${
            isDisabled ? "bg-neutral-600 text-neutral-400" : "bg-neutral-600 text-neutral-200"
          }`}>
          {cdKey.key}
        </code>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(cdKey.status)}`}>
          {cdKey.status}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        {+reportCount > 0 ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {reportCount} reports
          </span>
        ) : (
          <span className="text-neutral-500 text-sm">-</span>
        )}
      </td>
      <td className={`px-6 py-4 text-center text-sm ${isDisabled ? "text-neutral-500" : "text-neutral-300"}`}>
        {cdKey.version}
      </td>
      <td className={`px-6 py-4 text-center text-sm ${isDisabled ? "text-neutral-500" : "text-neutral-300"}`}>
        {cdKey.validFrom?.split("T")[0]}
      </td>
      <td className={`px-6 py-4 text-center text-sm ${isDisabled ? "text-neutral-500" : "text-neutral-300"}`}>
        {cdKey.validUntil?.split("T")[0]}
      </td>
      {!isDisabled && (
        <td className="px-6 py-4 text-center">
          <CDKeyActions key={cdKey.key} cdKey={cdKey} isDisabled={isDisabled} slug={slug} />
        </td>
      )}
    </tr>
  );
}
