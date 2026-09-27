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
        className={`relative flex h-[90vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-blue-200 bg-white px-6 py-4">
          <div className="min-w-0">
            <h2 id="admin-details-title" className="flex items-center text-2xl font-bold text-gray-900">
              <span className={`mr-3 h-7 w-1 shrink-0 rounded-full ${bar}`} />
              {title}
            </h2>
            {subtitle ? <div className="mt-1 pl-4 text-base font-medium text-primary-800">{subtitle}</div> : null}
          </div>
          <ModalCloseButton
            onClick={onClose}
            className="cursor-pointer rounded-full p-3 text-gray-800 hover:bg-gray-100 hover:text-gray-950"
            iconClassName="h-7 w-7"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-gray-900">
          {visitorPosition === "top" ? visitor : null}
          {children}
          {visitorPosition === "bottom" ? visitor : null}
        </div>

        <div className="flex items-center justify-between gap-4 border-t-2 border-blue-200 bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-3">
          <div className="min-w-0 text-sm font-medium text-gray-800">{footer}</div>
          <div className="flex shrink-0 items-center gap-2">
            {footerActions}
            <ModalCloseButton
              onClick={onClose}
              className="cursor-pointer rounded-xl border-2 border-blue-600 bg-blue-600 px-8 py-3 text-base font-bold text-white shadow-lg hover:border-blue-700 hover:bg-blue-700"
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
