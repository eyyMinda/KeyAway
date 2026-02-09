"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FaTimes } from "react-icons/fa";
import type { Program } from "@/src/types/program";
import { titleToSlug, validateSlug } from "./programSlugUtils";
import DeleteProgramModal from "./DeleteProgramModal";
import SlugChangeConfirmModal from "./SlugChangeConfirmModal";
import ImageLibraryModal from "./ImageLibraryModal";
import ProgramImageField from "./ProgramImageField";

interface ProgramEditModalProps {
  program: Program | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export default function ProgramEditModal({ program, isOpen, onClose, onSaved, onDeleted }: ProgramEditModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [downloadLink, setDownloadLink] = useState("");
  const [imageAssetId, setImageAssetId] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteExpanded, setDeleteExpanded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [slugChangeConfirmOpen, setSlugChangeConfirmOpen] = useState(false);

  const syncFromProgram = useCallback(() => {
    if (program) {
      setTitle(program.title);
      setSlug(program.slug?.current ?? "");
      setDescription(program.description ?? "");
      setDownloadLink(program.downloadLink ?? "");
      setImageAssetId(program.image?.asset?._ref ?? null);
      setDeleteExpanded(false);
      setDeleteConfirm("");
      setDeleteError(null);
    } else {
      setTitle("");
      setSlug("");
      setDescription("");
      setDownloadLink("");
      setImageAssetId(null);
      setDeleteExpanded(false);
      setDeleteConfirm("");
      setDeleteError(null);
    }
    setSlugChangeConfirmOpen(false);
    setLibraryOpen(false);
    setSaveError(null);
  }, [program]);

  useEffect(() => {
    if (isOpen) syncFromProgram();
  }, [program, isOpen, syncFromProgram]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (slugChangeConfirmOpen) {
          setSlugChangeConfirmOpen(false);
        } else if (libraryOpen) {
          setLibraryOpen(false);
        } else if (deleteExpanded) {
          setDeleteExpanded(false);
          setDeleteConfirm("");
          setDeleteError(null);
        } else {
          onClose();
        }
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, deleteExpanded, libraryOpen, slugChangeConfirmOpen]);

  const slugValidation = validateSlug(slug);
  const canSave =
    title.trim() && slugValidation.normalized && !slugValidation.error && description.trim() && !saveLoading;

  const performSave = async () => {
    if (!canSave) return;
    setSaveError(null);
    setSaveLoading(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slugValidation.normalized,
        description: description.trim(),
        downloadLink: downloadLink.trim() || undefined,
        ...(program?._id ? { imageAssetId: imageAssetId ?? null } : imageAssetId ? { imageAssetId } : {})
      };
      const url = program?._id ? `/api/admin/programs/${program._id}` : "/api/admin/programs";
      const method = program?._id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data?.error ?? "Failed to save");
        return;
      }
      onSaved();
      onClose();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    const originalSlug = program?.slug?.current ?? "";
    const newSlug = slugValidation.normalized ?? "";
    if (program && originalSlug && newSlug !== originalSlug) {
      setSlugChangeConfirmOpen(true);
      return;
    }
    performSave();
  };

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/admin/programs/upload-image", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data?.error ?? "Upload failed");
        return;
      }
      if (data.assetId) setImageAssetId(data.assetId);
    } finally {
      setUploadLoading(false);
      e.target.value = "";
    }
  }, []);

  const openLibrary = useCallback(() => setLibraryOpen(true), []);

  const handleDelete = async () => {
    if (!program?._id || deleteConfirm.trim() !== program.title.trim()) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/programs/${program._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data?.error ?? "Failed to delete");
        return;
      }
      onDeleted();
      onClose();
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">{program ? "Edit program" : "Add program"}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => {
                const v = e.target.value;
                setTitle(v);
                if (!program) setSlug(titleToSlug(v));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              disabled={saveLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              onBlur={() => {
                const { normalized, error } = validateSlug(slug);
                if (!error && normalized && normalized !== slug) setSlug(normalized);
              }}
              placeholder="URL-friendly, lowercase, hyphens"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                slugValidation.error ? "border-red-500" : "border-gray-300"
              }`}
              disabled={saveLoading}
            />
            {slugValidation.error && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {slugValidation.error}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              disabled={saveLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Download link</label>
            <input
              type="url"
              value={downloadLink}
              onChange={e => setDownloadLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              disabled={saveLoading}
            />
          </div>

          <ProgramImageField
            imageAssetId={imageAssetId}
            onAssetIdChange={setImageAssetId}
            uploadLoading={uploadLoading}
            onUpload={handleUpload}
            onOpenLibrary={openLibrary}
            disabled={saveLoading}
          />

          {saveError && (
            <p className="text-sm text-red-600" role="alert">
              {saveError}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {saveLoading ? "Saving…" : "Save"}
            </button>
            <button
              onClick={onClose}
              disabled={saveLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 cursor-pointer">
              Close
            </button>
          </div>

          {program && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <p className="text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => setDeleteExpanded(true)}
                  className="text-gray-500 underline hover:text-gray-600 cursor-pointer align-baseline">
                  Deleting this program
                </button>{" "}
                will remove it and all its CD keys. This cannot be undone.
              </p>
            </div>
          )}
        </div>

        <SlugChangeConfirmModal
          isOpen={slugChangeConfirmOpen}
          onClose={() => setSlugChangeConfirmOpen(false)}
          onConfirm={performSave}
          saving={saveLoading}
        />

        <ImageLibraryModal isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} onSelect={setImageAssetId} />

        {deleteExpanded && program && (
          <DeleteProgramModal
            programTitle={program.title}
            confirmValue={deleteConfirm}
            onConfirmChange={setDeleteConfirm}
            onDelete={handleDelete}
            onCancel={() => {
              setDeleteExpanded(false);
              setDeleteConfirm("");
              setDeleteError(null);
            }}
            loading={deleteLoading}
            error={deleteError}
          />
        )}
      </div>
    </div>
  );
}
