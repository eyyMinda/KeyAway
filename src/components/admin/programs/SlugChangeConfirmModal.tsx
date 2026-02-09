"use client";

interface SlugChangeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saving?: boolean;
}

export default function SlugChangeConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  saving = false
}: SlugChangeConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm rounded-2xl"
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-gray-700">
          Changing the slug will change this program&apos;s URL. Links shared elsewhere may stop working. Are you sure
          you want to continue?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            disabled={saving}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 cursor-pointer">
            {saving ? "Saving…" : "Yes, change slug"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
