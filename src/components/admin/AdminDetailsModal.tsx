"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import AdminVisitorSection from "@/src/components/admin/AdminVisitorSection";
import { ModalCloseButton } from "@/src/components/ui/ModalCloseButton";
import { modalSectionStyles } from "@/src/theme/colorSchema";

type Accent = keyof typeof modalSectionStyles;

type AdminDetailsModalProps = {
  title: string;
  subtitle?: ReactNode;
  accent?: Accent;
  onClose: () => void;
  children: ReactNode;
  /** Left side of the footer. */
  footer?: ReactNode;
  /** Extra controls beside Close. */
  footerActions?: ReactNode;
  /** When set, the visitor panel is rendered with the dialog. */
  visitorHash?: string;
  /** Suggestions and contact keep the visitor panel under their own fields. */
  visitorPosition?: "top" | "bottom";
  onSpammerChanged?: () => void | Promise<void>;
  maxWidthClass?: string;
};

/** Shared admin detail dialog: colored title bar, scroll lock, rounded shell, optional visitor panel. */
export default function AdminDetailsModal({
  title,
  subtitle,
  accent = "blue",
  onClose,
  children,
  footer,
  footerActions,
  visitorHash,
  visitorPosition = "top",
  onSpammerChanged,
  maxWidthClass = "max-w-4xl"
}: AdminDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const bar = modalSectionStyles[accent].bar;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  const visitor =
    visitorHash !== undefined ? (
      <div className={visitorPosition === "bottom" ? "mt-6" : "mb-6"}>
        <AdminVisitorSection ipHash={visitorHash} onSpammerChanged={onSpammerChanged} />
      </div>
    ) : null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-details-title"
        className={`relative flex h-[90vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl`}
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`h-8 w-1 shrink-0 rounded-full ${bar}`} />
            <div className="min-w-0">
              <h2 id="admin-details-title" className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              {subtitle ? <div className="truncate text-sm text-gray-600 dark:text-gray-300">{subtitle}</div> : null}
            </div>
          </div>
          <ModalCloseButton
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            iconClassName="h-5 w-5"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5 text-gray-900 dark:text-gray-100">
          {visitorPosition === "top" ? visitor : null}
          {children}
          {visitorPosition === "bottom" ? visitor : null}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-2.5">
          <div className="min-w-0 truncate text-xs text-gray-600 dark:text-gray-300">{footer}</div>
          <div className="flex shrink-0 items-center gap-2">
            {footerActions}
            <ModalCloseButton
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-1.5 text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Close
            </ModalCloseButton>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
