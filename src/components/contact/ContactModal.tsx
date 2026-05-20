"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ModalCloseButton } from "@/src/components/ui/ModalCloseButton";
import ContactForm from "./ContactForm";
import KeySuggestionForm from "./KeySuggestionForm";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "contact" | "suggest";
}

export default function ContactModal({ isOpen, onClose, defaultTab = "suggest" }: ContactModalProps) {
  const [activeTab, setActiveTab] = useState<"contact" | "suggest">(defaultTab);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Update active tab when defaultTab changes and modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-300 flex items-center justify-center overflow-y-auto p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative my-auto w-full max-w-2xl overflow-hidden rounded-sm border border-[#2a475e] bg-[#1b2838] shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-[90vh]"
        style={{ animation: "slideDown 0.3s ease-out" }}>
        <div className="flex items-center justify-between border-b border-[#2a475e] bg-[#16202d] px-6 py-4">
          <h2 className="text-xl font-bold text-[#c6d4df]">Get in Touch</h2>
          <ModalCloseButton
            onClick={onClose}
            className="rounded-sm p-2 text-[#8f98a0] hover:bg-[#213246] hover:text-[#c6d4df]"
            iconClassName="h-5 w-5"
            aria-label="Close modal"
          />
        </div>

        <div className="flex border-b border-[#2a475e] bg-[#16202d] px-6">
          <button
            onClick={() => setActiveTab("suggest")}
            className={`px-6 py-3 font-medium text-sm transition-colors cursor-pointer relative ${
              activeTab === "suggest"
                ? "border-b-2 border-[#66c0f4] text-[#c6d4df]"
                : "text-[#8f98a0] hover:text-[#c6d4df]"
            }`}>
            Suggest a Key
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`px-6 py-3 font-medium text-sm transition-colors cursor-pointer relative ${
              activeTab === "contact"
                ? "border-b-2 border-[#66c0f4] text-[#c6d4df]"
                : "text-[#8f98a0] hover:text-[#c6d4df]"
            }`}>
            Contact Us
          </button>
        </div>

        <div className="max-h-[calc(90vh-140px)] overflow-y-auto bg-[#1b2838] p-6">
          {activeTab === "suggest" ? <KeySuggestionForm onSuccess={onClose} /> : <ContactForm onSuccess={onClose} />}
        </div>
      </div>
    </div>,
    document.body
  );
}
