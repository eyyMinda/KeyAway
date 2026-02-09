"use client";

interface DeleteProgramModalProps {
  programTitle: string;
  confirmValue: string;
  onConfirmChange: (value: string) => void;
  onDelete: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

export default function DeleteProgramModal({
  programTitle,
  confirmValue,
  onConfirmChange,
  onDelete,
  onCancel,
  loading,
  error
}: DeleteProgramModalProps) {
  const match = confirmValue.trim() === programTitle.trim();

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm rounded-2xl">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-gray-700">
          Type the program name to confirm: <strong>{programTitle}</strong>
        </p>
        <input
          type="text"
          value={confirmValue}
          onChange={e => onConfirmChange(e.target.value)}
          placeholder="Program name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
          disabled={loading}
        />
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onDelete}
            disabled={!match || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            {loading ? "Deleting…" : "Delete"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
