"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { CDKey, ProgramFlow, ReportData } from "@/src/types/program";
import CDKeyActions from "./CDKeyActions";
import ReportProgressBar from "./ReportProgressBar";
import Toast from "@/src/components/ui/Toast";
import { formatValidUntilDisplay, getStatusColor } from "@/src/lib/program/cdKeyUtils";
import { useCopyTracking } from "@/src/hooks/useCopyTracking";
import {
  getActivationCopyText,
  getActivationEntryDisplayLabel,
  isAccountFlow,
  isLinkAccountFlow
} from "@/src/lib/program/activationEntry";
import { trackCopyEvent } from "@/src/lib/analytics/copyTracking";
import { NOTIFICATION_DURATION, getSuccessMessage, getErrorMessage } from "@/src/lib/notifications/notificationUtils";
import { useI18n } from "@/src/contexts/i18n";

interface CDKeyMobileCardProps {
  cdKey: CDKey;
  rowStorageId: string;
  slug: string;
  programFlow: ProgramFlow;
  reportData: ReportData;
  onReportSubmitted?: () => void;
  isSpammerVisitor?: boolean;
}

export default function CDKeyMobileCard({
  cdKey,
  rowStorageId,
  slug,
  programFlow,
  reportData,
  onReportSubmitted,
  isSpammerVisitor = false
}: CDKeyMobileCardProps) {
  const { t } = useI18n("program");
  const [toast, setToast] = useState<string | null>(null);
  const isDisabled = cdKey.status === "limit" || cdKey.status === "expired";
  const rowLabel = getActivationEntryDisplayLabel(cdKey, programFlow);
  const username = (cdKey.username ?? "").trim();
  const password = (cdKey.password ?? "").trim();
  const rawCopy = getActivationCopyText(cdKey, programFlow) ?? "";
  const clipboardMatch = isLinkAccountFlow(programFlow) || isAccountFlow(programFlow) ? "" : rawCopy;

  useCopyTracking({ cdKey, slug, programFlow, clipboardMatch });

  const copyAccountField = async (value: string, copiedLabel: "username" | "password") => {
    if (isDisabled || !value) {
      setToast(getErrorMessage("COPY_FAILED"));
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setToast(getSuccessMessage("COPIED", copiedLabel === "username" ? "Username" : "Password"));
      trackCopyEvent(cdKey, slug, "button_click", programFlow);
    } catch {
      setToast(getErrorMessage("COPY_FAILED"));
    }
  };

  const accountCodeBtn =
    "block w-full whitespace-pre-wrap break-words rounded-sm border border-[#3d6e8c] bg-[#32465a] px-4 py-3 text-center font-mono text-xs font-semibold text-[#c6d4df] select-text xs:text-sm";

  return (
    <div
      className={`mx-auto flex w-full max-w-xs flex-col gap-3 rounded-sm border border-[#2a475e] bg-[#1b2838] p-3 transition-all duration-300 ${
        isDisabled ? "opacity-50" : "hover:bg-[#213246]"
      }`}>
      {toast && typeof document !== "undefined"
        ? createPortal(
            <Toast message={toast} type="info" duration={NOTIFICATION_DURATION.SHORT} onClose={() => setToast(null)} />,
            document.body
          )
        : null}

      {isAccountFlow(programFlow) ? (
        <button
          type="button"
          className={`${accountCodeBtn} ${isDisabled || !username ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:bg-[#3d5770]"}`}
          disabled={isDisabled || !username}
          title={t.keyTable.copyUsernameTitle()}
          onClick={() => void copyAccountField(username, "username")}>
          {rowLabel}
        </button>
      ) : (
        <code className={`${accountCodeBtn} cursor-default`}>{rowLabel}</code>
      )}

      {isAccountFlow(programFlow) && (
        <button
          type="button"
          className={`${accountCodeBtn} ${isDisabled || !password ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:bg-[#3d5770]"}`}
          disabled={isDisabled || !password}
          title={t.keyTable.copyPasswordTitle()}
          onClick={() => void copyAccountField(password, "password")}>
          {password || "—"}
        </button>
      )}

      <div className="text-xs text-[#8f98a0]">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[#556772]">Program Version:</span>
            <div className="font-medium text-[#c6d4df]">{cdKey.version}</div>
          </div>
          <div>
            <span className="text-[#556772]">Status:</span>
            <div className="mt-1">
              <span
                className={`inline-flex rounded-sm px-3 py-1 text-xs font-semibold ${getStatusColor(cdKey.status)}`}>
                {cdKey.status}
              </span>
            </div>
          </div>
          <div>
            <span className="text-[#556772]">Valid From:</span>
            <div className="font-medium text-[#c6d4df]">{cdKey.validFrom?.split("T")[0]}</div>
          </div>
          <div>
            <span className="text-[#556772]">Valid Until:</span>
            <div className="font-medium text-[#c6d4df]">{formatValidUntilDisplay(cdKey.validUntil)}</div>
          </div>
        </div>
      </div>

      <ReportProgressBar reportData={reportData} />

      {!isDisabled && (
        <div className="border-t border-[#2a475e] pt-3">
          <CDKeyActions
            cdKey={cdKey}
            rowStorageId={rowStorageId}
            isDisabled={isDisabled}
            slug={slug}
            programFlow={programFlow}
            onReportSubmitted={onReportSubmitted}
            isSpammerVisitor={isSpammerVisitor}
          />
        </div>
      )}
    </div>
  );
}
