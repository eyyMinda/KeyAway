"use client";

import { useEffect, useRef } from "react";
import { FaTimes, FaExternalLinkAlt, FaCopy } from "react-icons/fa";
import { KeySuggestion } from "@/src/types/contact";

interface SuggestionDetailsModalProps {
  suggestion: KeySuggestion;
  onClose: () => void;
  onStatusChange: (newStatus: KeySuggestion["status"]) => void;
}

export default function SuggestionDetailsModal({ suggestion, onClose, onStatusChange }: SuggestionDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(suggestion.cdKey);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        style={{ animation: "slideDown 0.3s ease-out" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">Suggestion Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
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
          {suggestion.message && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Additional Notes</label>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
                {suggestion.message}
              </p>
            </div>
          )}

          {/* Contact Information */}
          {(suggestion.name || suggestion.email) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Contact Name</label>
                <p className="text-gray-900">
                  {suggestion.name || <span className="text-gray-400">Not provided</span>}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Contact Email</label>
                {suggestion.email ? (
                  <a href={`mailto:${suggestion.email}`} className="text-primary-600 hover:text-primary-700">
                    {suggestion.email}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </div>
            </div>
          )}

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
                onChange={e => onStatusChange(e.target.value as KeySuggestion["status"])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer text-gray-900">
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="added">Added</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
