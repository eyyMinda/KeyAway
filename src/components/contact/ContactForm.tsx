"use client";

import { useState } from "react";
import { ContactFormData } from "@/src/types/contact";

interface ContactFormProps {
  onSuccess: () => void;
}

export default function ContactForm({ onSuccess }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    title: "",
    message: "",
    name: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to submit message");

      // Reset form and close modal
      setFormData({ title: "", message: "", name: "", email: "" });
      onSuccess();
    } catch (err) {
      setError("Failed to submit message. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-[#8f98a0]">Have a question or feedback? Send us a message.</p>

      {error && <div className="rounded-sm border border-[#6d2626] bg-[#2a2020] p-3 text-sm text-[#df7f7f]">{error}</div>}

      {/* Title */}
      <div>
        <label htmlFor="contact-title" className="mb-1 block text-sm font-medium text-[#c6d4df]">
          Title <span className="text-[#d36868]">*</span>
        </label>
        <input
          id="contact-title"
          type="text"
          required
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-sm border border-[#3d6e8c] bg-[#32465a] px-4 py-2 text-[#c6d4df] placeholder:text-[#556772] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30"
          placeholder="Brief subject of your message"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-[#c6d4df]">
          Message <span className="text-[#d36868]">*</span>
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={formData.message}
          onChange={e => setFormData({ ...formData, message: e.target.value })}
          className="w-full resize-none rounded-sm border border-[#3d6e8c] bg-[#32465a] px-4 py-2 text-[#c6d4df] placeholder:text-[#556772] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30"
          placeholder="Your message..."
        />
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-[#c6d4df]">
            Name <span className="text-xs text-[#8f98a0]">(optional)</span>
          </label>
          <input
            id="contact-name"
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-sm border border-[#3d6e8c] bg-[#32465a] px-4 py-2 text-[#c6d4df] placeholder:text-[#556772] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-[#c6d4df]">
            Email <span className="text-xs text-[#8f98a0]">(optional)</span>
          </label>
          <input
            id="contact-email"
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-sm border border-[#3d6e8c] bg-[#32465a] px-4 py-2 text-[#c6d4df] placeholder:text-[#556772] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30"
            placeholder="your@email.com"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer rounded-sm border border-[#5c8529] bg-[#4c6b22] py-3 font-medium text-[#c6d4df] transition-colors hover:bg-[#5c8529] hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
