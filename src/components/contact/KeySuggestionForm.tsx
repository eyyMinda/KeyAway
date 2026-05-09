"use client";

import { useState } from "react";
import { KeySuggestionFormData } from "@/src/types/contact";

interface KeySuggestionFormProps {
  onSuccess: () => void;
}

export default function KeySuggestionForm({ onSuccess }: KeySuggestionFormProps) {
  const [formData, setFormData] = useState<KeySuggestionFormData>({
    cdKey: "",
    programName: "",
    programVersion: "",
    programLink: "",
    name: "",
    email: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/v1/key-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to submit suggestion");

      // Reset form and close modal
      setFormData({
        cdKey: "",
        programName: "",
        programVersion: "",
        programLink: "",
        name: "",
        email: "",
        message: ""
      });
      onSuccess();
    } catch (err) {
      setError("Failed to submit suggestion. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-[#8f98a0]">
        Found a free CD key? Help the community by suggesting it! We&apos;ll review and add it to the website.
      </p>

      {error && <div className="rounded-sm border border-[#6d2626] bg-[#2a2020] p-3 text-sm text-[#df7f7f]">{error}</div>}

      {/* CD Key */}
      <div>
        <label htmlFor="suggest-cdkey" className="mb-1 block text-sm font-medium text-[#c6d4df]">
          CD Key <span className="text-[#d36868]">*</span>
        </label>
        <input
          id="suggest-cdkey"
          type="text"
          required
          value={formData.cdKey}
          onChange={e => setFormData({ ...formData, cdKey: e.target.value })}
          className="key-mono w-full rounded-sm border border-[#3d6e8c] bg-[#32465a] px-4 py-2 text-[#c6d4df] placeholder:text-[#556772] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30"
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
        />
      </div>

      {/* Program Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="suggest-program" className="mb-1 block text-sm font-medium text-[#c6d4df]">
            Program Name <span className="text-[#d36868]">*</span>
          </label>
          <input
            id="suggest-program"
            type="text"
            required
            value={formData.programName}
            onChange={e => setFormData({ ...formData, programName: e.target.value })}
            className="w-full rounded-sm border border-[#3d6e8c] bg-[#32465a] px-4 py-2 text-[#c6d4df] placeholder:text-[#556772] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30"
            placeholder="e.g., IObit Driver Booster"
          />
        </div>

        <div>
          <label htmlFor="suggest-version" className="mb-1 block text-sm font-medium text-[#c6d4df]">
            Program Version <span className="text-[#d36868]">*</span>
          </label>
          <input
            id="suggest-version"
            type="text"
            required
            value={formData.programVersion}
            onChange={e => setFormData({ ...formData, programVersion: e.target.value })}
            className="w-full rounded-sm border border-[#3d6e8c] bg-[#32465a] px-4 py-2 text-[#c6d4df] placeholder:text-[#556772] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30"
            placeholder="e.g., 12.0"
          />
        </div>
      </div>

      {/* Program Link */}
      <div>
        <label htmlFor="suggest-link" className="mb-1 block text-sm font-medium text-[#c6d4df]">
          Program/Download Link <span className="text-[#d36868]">*</span>
        </label>
        <input
          id="suggest-link"
          type="url"
          required
          value={formData.programLink}
          onChange={e => setFormData({ ...formData, programLink: e.target.value })}
          className="w-full rounded-sm border border-[#3d6e8c] bg-[#32465a] px-4 py-2 text-[#c6d4df] placeholder:text-[#556772] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30"
          placeholder="https://example.com/program"
        />
      </div>

      {/* Optional Contact Info */}
      <div className="border-t border-[#2a475e] pt-4">
        <p className="mb-3 text-sm text-[#8f98a0]">
          <span className="font-medium text-[#c6d4df]">Optional:</span> Leave your contact info in case we need more details about this
          key.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="suggest-name" className="mb-1 block text-sm font-medium text-[#c6d4df]">
              Name <span className="text-xs text-[#8f98a0]">(optional)</span>
            </label>
            <input
              id="suggest-name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-sm border border-[#3d6e8c] bg-[#32465a] px-4 py-2 text-[#c6d4df] placeholder:text-[#556772] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="suggest-email" className="mb-1 block text-sm font-medium text-[#c6d4df]">
              Email <span className="text-xs text-[#8f98a0]">(optional)</span>
            </label>
            <input
              id="suggest-email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-sm border border-[#3d6e8c] bg-[#32465a] px-4 py-2 text-[#c6d4df] placeholder:text-[#556772] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30"
              placeholder="your@email.com"
            />
          </div>
        </div>

        {/* Optional Message */}
        <div className="mt-4">
          <label htmlFor="suggest-message" className="mb-1 block text-sm font-medium text-[#c6d4df]">
            Additional Notes <span className="text-xs text-[#8f98a0]">(optional)</span>
          </label>
          <textarea
            id="suggest-message"
            rows={3}
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
            className="w-full resize-none rounded-sm border border-[#3d6e8c] bg-[#32465a] px-4 py-2 text-[#c6d4df] placeholder:text-[#556772] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30"
            placeholder="Any additional information..."
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer rounded-sm border border-[#5c8529] bg-[#4c6b22] py-3 font-medium text-[#c6d4df] transition-colors hover:bg-[#5c8529] hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "Submitting..." : "Submit Suggestion"}
      </button>
    </form>
  );
}
