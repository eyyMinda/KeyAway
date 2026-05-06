"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { CDKeyItemProps } from "@/src/types";
import CDKeyActions from "@/src/components/program/cdkeys/CDKeyActions";
import ReportProgressBar from "@/src/components/program/cdkeys/ReportProgressBar";
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
import { trackActivationLinkClick } from "@/src/lib/analytics/linkActivationTracking";
import { NOTIFICATION_DURATION, getSuccessMessage, getErrorMessage } from "@/src/lib/notifications/notificationUtils";
import { useI18n } from "@/src/contexts/i18n";

export default function CDKeyItem({
  cdKey,
  index: _index,
  rowStorageId,
  slug,
  programFlow,
  reportData,
  onReportSubmitted,
  isSpammerVisitor = false
}: CDKeyItemProps) {
  const { t } = useI18n("program");
  const [toast, setToast] = useState<string | null>(null);
  const isDisabled = cdKey.status === "limit" || cdKey.status === "expired";
  const isAccount = isAccountFlow(programFlow);
  const isLinkAccount = isLinkAccountFlow(programFlow);
  const rowLabel = getActivationEntryDisplayLabel(cdKey, programFlow);
  const username = (cdKey.username ?? "").trim();
  const password = (cdKey.password ?? "").trim();
  const rawCopy = getActivationCopyText(cdKey, programFlow) ?? "";
  const clipboardMatch = isLinkAccount || isAccount ? "" : rawCopy;
  const firstLinkUrl = (cdKey.giveawayLinks ?? []).find(l => (l?.url ?? "").trim())?.url?.trim() ?? "";
  const isInteractiveFirstCell = isAccount || isLinkAccount;
  const firstCellTitle = isAccount
    ? t.keyTable.copyUsernameTitle()
    : isLinkAccount
      ? "Open link"
      : t.keyTable.copyTitle();

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

  const handleFirstColumnClick = async () => {
    if (isDisabled) {
      setToast(getErrorMessage("COPY_FAILED"));
      return;
    }

    if (isAccount) {
      await copyAccountField(username, "username");
      return;
    }

    if (isLinkAccount) {
      if (!firstLinkUrl) {
        return;
      }
      window.open(firstLinkUrl, "_blank", "noopener,noreferrer");
      trackActivationLinkClick(cdKey, slug, programFlow, firstLinkUrl, "left");
      return;
    }
  };

  const codeVisual = (interactive: boolean) =>
    `px-3 py-1 rounded-lg text-sm font-mono select-text max-w-md inline-block align-bottom ${
      isDisabled
        ? "bg-neutral-100/80 text-neutral-700"
        : interactive
          ? "bg-neutral-100 text-black cursor-pointer hover:bg-neutral-200"
          : "bg-neutral-100 text-black"
    }`;

  return (
    <>
      {toast && typeof document !== "undefined"
        ? createPortal(
            <Toast
              message={toast}
              type="info"
              duration={NOTIFICATION_DURATION.SHORT}
              onClose={() => setToast(null)}
            />,
            document.body
          )
        : null}
      <tr className={`hover:bg-neutral-700 transition-colors ${isDisabled ? "opacity-50" : ""}`}>
      <td className="p-4 text-nowrap">
        {isInteractiveFirstCell ? (
          <button
            type="button"
            className={`${codeVisual(true)} truncate text-left`}
            disabled={
              isDisabled || (isAccount ? !username : isLinkAccount ? !firstLinkUrl : true)
            }
            title={firstCellTitle}
            onClick={() => void handleFirstColumnClick()}>
            {rowLabel}
          </button>
        ) : (
          <code className={`${codeVisual(false)} truncate`}>{rowLabel}</code>
        )}
      </td>
      {isAccount && (
        <td className="p-4 text-nowrap text-center">
          <button
            type="button"
            className={`${codeVisual(true)} break-all`}
            disabled={isDisabled || !password}
            title={t.keyTable.copyPasswordTitle()}
            onClick={() => void copyAccountField(password, "password")}>
            {password || "—"}
          </button>
        </td>
      )}
      <td className="p-4">
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(cdKey.status)}`}>
          {cdKey.status}
        </span>
      </td>
      <td className="p-4">
        <ReportProgressBar reportData={reportData} />
      </td>
      <td className={`p-4 text-center text-sm ${isDisabled ? "text-neutral-500" : "text-neutral-300"}`}>
        {cdKey.version}
      </td>
      <td className={`p-4 text-center text-sm ${isDisabled ? "text-neutral-500" : "text-neutral-300"}`}>
        {cdKey.validFrom?.split("T")[0]}
      </td>
      <td className={`p-4 text-center text-sm ${isDisabled ? "text-neutral-500" : "text-neutral-300"}`}>
        {formatValidUntilDisplay(cdKey.validUntil)}
      </td>
      <td className="p-4 text-center">
        {!isDisabled ? (
          <CDKeyActions
            cdKey={cdKey}
            rowStorageId={rowStorageId}
            isDisabled={isDisabled}
            slug={slug}
            programFlow={programFlow}
            onReportSubmitted={onReportSubmitted}
            isSpammerVisitor={isSpammerVisitor}
          />
        ) : (
          <span className="text-neutral-500 text-xs">—</span>
        )}
      </td>
    </tr>
    </>
  );
}
