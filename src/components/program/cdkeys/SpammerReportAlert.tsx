"use client";

import { FiAlertTriangle } from "react-icons/fi";
import {
  SPAMMER_REPORT_MODAL_ALERT_TITLE,
  SPAMMER_REPORT_RESTRICTION_NOTICE
} from "@/src/lib/notifications/notificationUtils";

/** Prominent spammer notice for report / renew modals. */
export default function SpammerReportAlert() {
  return (
    <div className="mb-4 rounded-sm border border-[#c62828] bg-[#3d1515] p-4" role="alert" aria-live="polite">
      <div className="flex items-start gap-3">
        <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#ff8a80]" aria-hidden />
        <div>
          <h4 className="text-sm font-semibold text-[#ff8a80]">{SPAMMER_REPORT_MODAL_ALERT_TITLE}</h4>
          <p className="mt-2 text-sm leading-relaxed text-[#f4a460]">{SPAMMER_REPORT_RESTRICTION_NOTICE}</p>
        </div>
      </div>
    </div>
  );
}
