"use client";

import { useState } from "react";
import { FaImage } from "react-icons/fa";
import { urlFor } from "@/src/sanity/lib/image";
import type { ImageValue } from "./programForm";

interface ImagePickerProps {
  label: string;
  value: ImageValue;
  onChange: (v: ImageValue) => void;
  /** Opens the shared image library; resolves with the picked asset id. */
  onOpenLibrary: (onPick: (assetId: string) => void) => void;
  hint?: string;
  /** Small square thumbnail (point icons). */
  small?: boolean;
  /** Show the "animated" toggle (about-section images). */
  animationToggle?: boolean;
}

export default function ImagePicker({ label, value, onChange, onOpenLibrary, hint, small, animationToggle }: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/v1/admin/program-images", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "Upload failed");
        return;
      }
      const assetId = data?.data?.assetId;
      if (assetId) onChange({ ...value, assetId, preserveAnimation: value.preserveAnimation || file.type === "image/gif" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const size = small ? "w-12 h-12" : "w-28 h-20";
  const link = "text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer";

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <div
          className={`${size} shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
          {value.assetId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlFor({ _type: "image", asset: { _ref: value.assetId } })
                .width(small ? 96 : 240)
                .fit("max")
                .url()}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <FaImage className="text-gray-300 dark:text-gray-600" size={small ? 16 : 22} />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <label className={link}>
              {uploading ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={uploading}
                onChange={upload}
              />
            </label>
            <button type="button" className={link} onClick={() => onOpenLibrary(assetId => onChange({ ...value, assetId }))}>
              Library
            </button>
            {value.assetId && (
              <button
                type="button"
                className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                onClick={() => onChange({ assetId: null })}>
                Remove
              </button>
            )}
          </div>
          {animationToggle && value.assetId && (
            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={!!value.preserveAnimation}
                onChange={e => onChange({ ...value, preserveAnimation: e.target.checked })}
              />
              Animated (GIF / animated WebP)
            </label>
          )}
          {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
