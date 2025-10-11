"use client";

import { useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import { ContactMessage } from "@/src/types/contact";

interface MessageDetailsModalProps {
  message: ContactMessage;
  onClose: () => void;
  onStatusChange: (newStatus: ContactMessage["status"]) => void;
}

export default function MessageDetailsModal({ message, onClose, onStatusChange }: MessageDetailsModalProps) {
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        style={{ animation: "slideDown 0.3s ease-out" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">Message Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Subject</label>
            <p className="text-lg font-semibold text-gray-900">{message.title}</p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Message</label>
            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
              {message.message}
            </p>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
              <p className="text-gray-900">{message.name || <span className="text-gray-400">Not provided</span>}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              {message.email ? (
                <a href={`mailto:${message.email}`} className="text-primary-600 hover:text-primary-700">
                  {message.email}
                </a>
              ) : (
                <span className="text-gray-400">Not provided</span>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Received</label>
              <p className="text-gray-900">{new Date(message.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <select
                value={message.status}
                onChange={e => onStatusChange(e.target.value as ContactMessage["status"])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer text-gray-900">
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
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
