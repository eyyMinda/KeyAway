"use client";

import { useEffect, useState, useCallback } from "react";
import { FaExternalLinkAlt, FaCopy } from "react-icons/fa";
import AdminDetailsModal from "@/src/components/admin/AdminDetailsModal";
import { KeySuggestion } from "@/src/types/contact";
import type { SuggestionUpdatePayload } from "./KeySuggestionsTable";

interface SuggestionDetailsModalProps {
  suggestion: KeySuggestion;
  onClose: () => void;
  onUpdateSuggestion: (updates: SuggestionUpdatePayload) => void;
  updating?: boolean;
}

export default function SuggestionDetailsModal({
  suggestion,
  onClose,
  onUpdateSuggestion,
  updating
}: SuggestionDetailsModalProps) {
  const [emailInput, setEmailInput] = useState(suggestion.email ?? "");
  const [nameInput, setNameInput] = useState(suggestion.name ?? "");
  const [emailSaved, setEmailSaved] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    setEmailInput(suggestion.email ?? "");
    setNameInput(suggestion.name ?? "");
  }, [suggestion._id, suggestion.email, suggestion.name]);

  const handleSaveEmail = useCallback(() => {
    const trimmed = emailInput.trim();
    if (trimmed === (suggestion.email ?? "").trim()) return;
    onUpdateSuggestion({ email: trimmed || undefined });
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2000);
  }, [emailInput, suggestion.email, onUpdateSuggestion]);

  const handleSaveName = useCallback(() => {
    const trimmed = nameInput.trim();
    if (trimmed === (suggestion.name ?? "").trim()) return;
    onUpdateSuggestion({ name: trimmed || undefined });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }, [nameInput, suggestion.name, onUpdateSuggestion]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(suggestion.cdKey);
  };

  return (
    <AdminDetailsModal
      title="Suggestion Details"
      onClose={onClose}
      visitorHash={suggestion.ipHash}
      visitorPosition="bottom"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-6">
          {/* Program Info */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Program Name</label>
            <p className="text-lg font-semibold text-gray-900">{suggestion.programName}</p>
          </div>

          {/* CD Key */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">CD Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-mono text-lg border border-gray-300">
                {suggestion.cdKey}
              </code>
              <button
                onClick={handleCopyKey}
                className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Copy key">
                <FaCopy />
              </button>
            </div>
          </div>

          {/* Version & Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Version</label>
              <p className="text-gray-900 font-semibold">v{suggestion.programVersion}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Program Link</label>
              <a
                href={suggestion.programLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                <span className="truncate">{new URL(suggestion.programLink).hostname}</span>
                <FaExternalLinkAlt size={12} />
              </a>
            </div>
          </div>

          {/* Additional Message */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Additional Notes</label>
            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
              {suggestion.message?.trim() || "-"}
            </p>
          </div>

          {/* Contact Information - always shown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Contact Name</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSaveName()}
                  placeholder="Add or edit name..."
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 text-sm"
                  disabled={updating}
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={updating || nameInput.trim() === (suggestion.name ?? "").trim()}
                  className="shrink-0 cursor-pointer px-3 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {nameSaved ? "Saved" : "Save"}
                </button>
              </div>
              {!nameInput.trim() && <p className="mt-1 text-sm text-gray-500">-</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Contact Email</label>
              <div className="flex gap-2 items-center">
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSaveEmail()}
                  placeholder="Add or edit email..."
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 text-sm"
                  disabled={updating}
                />
                <button
                  type="button"
                  onClick={handleSaveEmail}
                  disabled={updating || emailInput.trim() === (suggestion.email ?? "").trim()}
                  className="shrink-0 cursor-pointer px-3 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {emailSaved ? "Saved" : "Save"}
                </button>
              </div>
              {suggestion.email?.trim() && (
                <a
                  href={`mailto:${suggestion.email}`}
                  className="mt-1 inline-block text-sm text-primary-600 hover:text-primary-700">
                  Send mail
                </a>
              )}
              {!suggestion.email?.trim() && !emailInput.trim() && <p className="mt-1 text-sm text-gray-500">-</p>}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Submitted</label>
              <p className="text-gray-900">{new Date(suggestion.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <select
                value={suggestion.status}
                onChange={e => onUpdateSuggestion({ status: e.target.value as KeySuggestion["status"] })}
                disabled={updating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer text-gray-900 disabled:opacity-50">
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="added">Added</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

      </div>
    </AdminDetailsModal>
  );
}
