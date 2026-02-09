"use client";

import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { urlFor } from "@/src/sanity/lib/image";

interface ImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assetId: string) => void;
}

export default function ImageLibraryModal({ isOpen, onClose, onSelect }: ImageLibraryModalProps) {
  const [assets, setAssets] = useState<{ _id: string }[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch("/api/admin/programs/image-assets")
      .then(res => res.json().catch(() => ({})))
      .then(data => {
        if (!cancelled && Array.isArray(data.assets)) setAssets(data.assets);
        else if (!cancelled) setAssets([]);
      })
      .catch(() => {
        if (!cancelled) setAssets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm rounded-2xl"
      onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Choose image</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg cursor-pointer">
            <FaTimes size={18} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {assets.length === 0 ? (
            <p className="text-sm text-gray-500">No images in library. Upload an image first.</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1">
              {assets.map(asset => (
                <button
                  type="button"
                  key={asset._id}
                  onClick={() => {
                    onSelect(asset._id);
                    onClose();
                  }}
                  className="relative flex items-center justify-center max-w-28 max-h-28 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 focus:border-blue-500 cursor-pointer bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urlFor({ _type: "image", asset: { _ref: asset._id } })
                      .fit("max")
                      .url()}
                    alt=""
                    className="max-w-full max-h-24 w-auto h-auto object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
