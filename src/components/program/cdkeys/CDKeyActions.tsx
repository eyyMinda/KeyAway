"use client";

import { useState } from "react";
import { CDKeyActionsProps } from "@/src/types";
import { trackCopyEvent } from "@/src/lib/analytics/copyTracking";
import { trackActivationLinkInteraction } from "@/src/lib/analytics/linkActivationTracking";
import ReportPopup from "./ReportPopup";
import Toast from "@/src/components/ui/Toast";
import { NOTIFICATION_DURATION, getSuccessMessage, getErrorMessage } from "@/src/lib/notifications/notificationUtils";
import { getActivationCopyText, isAccountFlow, isLinkAccountFlow } from "@/src/lib/program/activationEntry";
import { useI18n } from "@/src/contexts/i18n";
import type { GiveawayLink } from "@/src/types/program";

export default function CDKeyActions({
  cdKey,
  rowStorageId,
  isDisabled,
  slug,
  programFlow,
  onReportSubmitted,
  isSpammerVisitor = false
}: CDKeyActionsProps) {
  const { t } = useI18n("program");
  const [notification, setNotification] = useState<string | null>(null);
  const [isReportPopupOpen, setIsReportPopupOpen] = useState(false);

  const copyText = getActivationCopyText(cdKey, programFlow);
  const copyLabel = t.keyTable.copyButton();
  const copyTitle = t.keyTable.copyTitle();
  const reportTitle = t.keyTable.reportTitle();
  const isAccount = isAccountFlow(programFlow);
  const isLinkAccount = isLinkAccountFlow(programFlow);
  const links = (cdKey.giveawayLinks ?? []).filter((l: GiveawayLink) => (l?.url ?? "").trim());
  const firstLinkUrl = (links[0]?.url ?? "").trim();

  const handlePrimaryClick = async () => {
    if (isLinkAccount) {
      if (!firstLinkUrl) {
        setNotification(getErrorMessage("COPY_FAILED"));
        return;
      }
      window.open(firstLinkUrl, "_blank", "noopener,noreferrer");
      trackActivationLinkInteraction(cdKey, slug, programFlow, firstLinkUrl, "left");
      return;
    }
    if (!copyText) {
      setNotification(getErrorMessage("COPY_FAILED"));
      return;
    }
    try {
      await navigator.clipboard.writeText(copyText);
      setNotification(getSuccessMessage("COPIED", "CD key"));
      trackCopyEvent(cdKey, slug, "button_click", programFlow);
    } catch (err) {
      console.error("Failed to copy: ", err);
      setNotification(getErrorMessage("COPY_FAILED"));
    }
  };

  const handleReportClick = () => {
    setIsReportPopupOpen(true);
  };

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const primaryDisabled = isLinkAccount ? isDisabled || !firstLinkUrl : isDisabled || !copyText;

  const reportButton = (
    <button
      type="button"
      onClick={handleReportClick}
      className={`inline-flex justify-center items-center px-3 py-1 text-white text-xs font-semibold rounded-lg transition-colors duration-200 bg-primary-600 hover:bg-primary-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        isAccount ? "w-full max-w-[220px] py-2 text-sm" : "w-full"
      }`}
      disabled={isDisabled}
      title={reportTitle}>
      Report
    </button>
  );

  if (isAccount) {
    return (
      <>
        <ReportPopup
          isOpen={isReportPopupOpen}
          onClose={() => setIsReportPopupOpen(false)}
          cdKey={cdKey}
          slug={slug}
          programFlow={programFlow}
          rowStorageId={rowStorageId}
          onReportSubmitted={onReportSubmitted}
          isSpammerVisitor={isSpammerVisitor}
        />
        <div className="flex justify-center">{reportButton}</div>
      </>
    );
  }

  return (
    <>
      {notification && (
        <Toast
          message={notification}
          type="info"
          duration={NOTIFICATION_DURATION.SHORT}
          onClose={handleNotificationClose}
        />
      )}

      <ReportPopup
        isOpen={isReportPopupOpen}
        onClose={() => setIsReportPopupOpen(false)}
        cdKey={cdKey}
        slug={slug}
        programFlow={programFlow}
        rowStorageId={rowStorageId}
        onReportSubmitted={onReportSubmitted}
        isSpammerVisitor={isSpammerVisitor}
      />

      <div className="flex justify-center space-x-2">
        <button
          onClick={() => void handlePrimaryClick()}
          className="w-full inline-flex justify-center items-center px-4 py-2 bg-neutral-100 hover:bg-neutral-300 text-black text-sm font-semibold rounded-lg transition-all duration-200 transform border-2 border-neutral-400 hover:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none cursor-pointer"
          disabled={primaryDisabled}
          title={copyTitle}
          type="button">
          {isLinkAccount ? (
            <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
          {copyLabel}
        </button>

        {reportButton}
      </div>
    </>
  );
}
