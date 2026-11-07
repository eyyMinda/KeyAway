"use client";

/** @fileoverview Inline-editable contact field (name / email) for admin message and suggestion details. */
import { useState } from "react";

export default function ContactField({
  label,
  value,
  type = "text",
  placeholder,
  disabled,
  onSave
}: {
  label: string;
  value?: string;
  type?: "text" | "email";
  placeholder: string;
  disabled?: boolean;
  onSave: (value: string | undefined) => void;
}) {
  const stored = value?.trim() ?? "";
  const [draft, setDraft] = useState(stored);
  const [lastStored, setLastStored] = useState(stored);
  const [saved, setSaved] = useState(false);
  const dirty = draft.trim() !== stored;

  // A saved or refetched value replaces the draft.
  if (lastStored !== stored) {
    setLastStored(stored);
    setDraft(stored);
  }

  const save = () => {
    if (!dirty) return;
    onSave(draft.trim() || undefined);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type={type}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          placeholder={placeholder}
          disabled={disabled}
          className="h-9 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        {(dirty || saved) && (
          <button
            type="button"
            onClick={save}
            disabled={disabled || !dirty}
            className="h-9 shrink-0 cursor-pointer rounded-lg bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saved && !dirty ? "Saved" : "Save"}
          </button>
        )}
      </span>
    </label>
  );
}
