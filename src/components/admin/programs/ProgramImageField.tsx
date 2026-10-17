"use client";

import { urlFor } from "@/src/sanity/lib/image";

interface ProgramImageFieldProps {
  label?: string;
  imageAssetId: string | null;
  onAssetIdChange: (assetId: string | null) => void;
  uploadLoading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenLibrary: () => void;
  disabled?: boolean;
}

export default function ProgramImageField({
  label = "Image",
  imageAssetId,
  onAssetIdChange,
  uploadLoading,
  onUpload,
  onOpenLibrary,
  disabled = false
}: ProgramImageFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {imageAssetId && (
        <div className="mb-2 relative inline-block">
          <div className="relative flex items-center justify-center max-w-32 max-h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlFor({ _type: "image", asset: { _ref: imageAssetId } })
                .fit("max")
                .url()}
              alt=""
              className="max-w-full max-h-32 w-auto h-auto object-contain"
            />
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <label className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
          {uploadLoading ? "Uploading…" : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={disabled || uploadLoading}
            onChange={onUpload}
          />
        </label>
        <button
          type="button"
          onClick={onOpenLibrary}
          disabled={disabled}
          className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
          Choose from library
        </button>
        {imageAssetId && (
          <button
            type="button"
            onClick={() => onAssetIdChange(null)}
            disabled={disabled}
            className="px-3 py-2 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer">
            Clear image
          </button>
        )}
      </div>
    </div>
  );
}
