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
      const response = await fetch("/api/suggest-key", {
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
      <p className="text-gray-600 text-sm">
        Found a free CD key? Help the community by suggesting it! I&apos;ll review and add it to the website.
      </p>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

      {/* CD Key */}
      <div>
        <label htmlFor="suggest-cdkey" className="block text-sm font-medium text-gray-700 mb-1">
          CD Key <span className="text-red-500">*</span>
        </label>
        <input
          id="suggest-cdkey"
          type="text"
          required
          value={formData.cdKey}
          onChange={e => setFormData({ ...formData, cdKey: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-gray-900"
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
        />
      </div>

      {/* Program Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="suggest-program" className="block text-sm font-medium text-gray-700 mb-1">
            Program Name <span className="text-red-500">*</span>
          </label>
          <input
            id="suggest-program"
            type="text"
            required
            value={formData.programName}
            onChange={e => setFormData({ ...formData, programName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
            placeholder="e.g., IObit Driver Booster"
          />
        </div>

        <div>
          <label htmlFor="suggest-version" className="block text-sm font-medium text-gray-700 mb-1">
            Program Version <span className="text-red-500">*</span>
          </label>
          <input
            id="suggest-version"
            type="text"
            required
            value={formData.programVersion}
            onChange={e => setFormData({ ...formData, programVersion: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
            placeholder="e.g., 12.0"
          />
        </div>
      </div>

      {/* Program Link */}
      <div>
        <label htmlFor="suggest-link" className="block text-sm font-medium text-gray-700 mb-1">
          Program/Download Link <span className="text-red-500">*</span>
        </label>
        <input
          id="suggest-link"
          type="url"
          required
          value={formData.programLink}
          onChange={e => setFormData({ ...formData, programLink: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
          placeholder="https://example.com/program"
        />
      </div>

      {/* Optional Contact Info */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-3">
          <span className="font-medium">Optional:</span> Leave your contact info in case I need more details about this
          key.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="suggest-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              id="suggest-name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="suggest-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              id="suggest-email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              placeholder="your@email.com"
            />
          </div>
        </div>

        {/* Optional Message */}
        <div className="mt-4">
          <label htmlFor="suggest-message" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            id="suggest-message"
            rows={3}
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900"
            placeholder="Any additional information..."
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
        {loading ? "Submitting..." : "Submit Suggestion"}
      </button>
    </form>
  );
}
