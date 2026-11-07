"use client";

import { useMemo } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import AdminDetailsModal from "@/src/components/admin/AdminDetailsModal";
import ContactField from "@/src/components/admin/email/ContactField";
import { EmailReplyComposer, EmailReplyHistory } from "@/src/components/admin/email/EmailReplyPanel";
import { CopyButton } from "@/src/components/admin/key-reports/keyReportUi";
import { RelativeDate, StatusPill } from "@/src/components/admin/list/AdminListKit";
import {
  SUGGESTION_STATUS_OPTIONS,
  SUGGESTION_STATUS_TONES
} from "@/src/components/admin/key-suggestions/suggestionStatus";
import { keySuggestionReplyContent } from "@/src/lib/email/keySuggestionReply";
import { KeySuggestion } from "@/src/types/contact";
import type { SuggestionUpdatePayload } from "./KeySuggestionsTable";

interface SuggestionDetailsModalProps {
  suggestion: KeySuggestion;
  onClose: () => void;
  onUpdateSuggestion: (updates: SuggestionUpdatePayload) => void;
  onReplySent: () => void;
  updating?: boolean;
}

const fullDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

function hostOf(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 min-w-0 text-sm text-gray-900 dark:text-gray-100">{children}</dd>
    </div>
  );
}

export default function SuggestionDetailsModal({
  suggestion,
  onClose,
  onUpdateSuggestion,
  onReplySent,
  updating
}: SuggestionDetailsModalProps) {
  const content = useMemo(() => keySuggestionReplyContent(suggestion), [suggestion]);

  return (
    <AdminDetailsModal
      title="Key suggestion"
      subtitle={suggestion.programName}
      onClose={onClose}
      visitorHash={suggestion.ipHash}
      visitorPosition="bottom"
      maxWidthClass="max-w-3xl"
      footer={
        <span>
          Submitted {fullDate(suggestion.createdAt)}
          {suggestion.lastRepliedAt ? ` · last replied ${fullDate(suggestion.lastRepliedAt)}` : ""}
        </span>
      }>
      <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-snug text-gray-900 dark:text-gray-100">
              {suggestion.programName}
              {suggestion.programVersion && (
                <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  v{suggestion.programVersion}
                </span>
              )}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              <RelativeDate iso={suggestion.createdAt} />
              {suggestion.replies?.length
                ? ` · ${suggestion.replies.length} sent ${suggestion.replies.length === 1 ? "reply" : "replies"}`
                : ""}
            </p>
          </div>
          <StatusPill
            value={suggestion.status}
            options={SUGGESTION_STATUS_OPTIONS}
            tones={SUGGESTION_STATUS_TONES}
            disabled={updating}
            onChange={status => onUpdateSuggestion({ status })}
          />
        </header>

        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Fact label="Suggested key">
                <span className="flex items-center gap-1.5">
                  <code className="break-all rounded-lg bg-gray-100 px-2.5 py-1.5 font-mono text-sm dark:bg-gray-800">
                    {suggestion.cdKey}
                  </code>
                  <CopyButton value={suggestion.cdKey} label="Copy key" />
                </span>
              </Fact>
            </div>
            <Fact label="Version">{suggestion.programVersion ? `v${suggestion.programVersion}` : "—"}</Fact>
            <Fact label="Program link">
              {suggestion.programLink ? (
                <a
                  href={suggestion.programLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 text-sky-700 hover:underline dark:text-sky-300">
                  <span className="truncate">{hostOf(suggestion.programLink)}</span>
                  <FaExternalLinkAlt className="h-3 w-3 shrink-0" aria-hidden />
                </a>
              ) : (
                "—"
              )}
            </Fact>
          </dl>
        </section>

        {suggestion.message?.trim() ? (
          <blockquote className="whitespace-pre-wrap break-words rounded-xl border-l-4 border-primary-500 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800 dark:bg-gray-800/50 dark:text-gray-200">
            {suggestion.message.trim()}
          </blockquote>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ContactField
            label="Name"
            value={suggestion.name}
            placeholder="Add a name…"
            disabled={updating}
            onSave={name => onUpdateSuggestion({ name })}
          />
          <ContactField
            label="Email"
            type="email"
            value={suggestion.email}
            placeholder="Add an email to reply…"
            disabled={updating}
            onSave={email => onUpdateSuggestion({ email })}
          />
        </div>

        <EmailReplyComposer
          email={suggestion.email}
          sendUrl={`/api/v1/admin/key-suggestions/${suggestion._id}/reply`}
          content={content}
          disabled={updating}
          onSent={onReplySent}
        />

        <EmailReplyHistory replies={suggestion.replies} />
      </div>
    </AdminDetailsModal>
  );
}
