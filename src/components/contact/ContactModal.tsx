"use client";

import { useState, useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import ContactForm from "./ContactForm";
import KeySuggestionForm from "./KeySuggestionForm";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "contact" | "suggest";
}

export default function ContactModal({ isOpen, onClose, defaultTab = "suggest" }: ContactModalProps) {
  const [activeTab, setActiveTab] = useState<"contact" | "suggest">(defaultTab);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        style={{ animation: "slideDown 0.3s ease-out" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">Get in Touch</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
          <button
            onClick={() => setActiveTab("suggest")}
            className={`px-6 py-3 font-medium text-sm transition-colors cursor-pointer relative ${
              activeTab === "suggest"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-600 hover:text-gray-900"
            }`}>
            Suggest a Key
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`px-6 py-3 font-medium text-sm transition-colors cursor-pointer relative ${
              activeTab === "contact"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-600 hover:text-gray-900"
            }`}>
            Contact Me
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === "suggest" ? <KeySuggestionForm onSuccess={onClose} /> : <ContactForm onSuccess={onClose} />}
        </div>
      </div>
    </div>
  );
}
