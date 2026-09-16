"use client";

interface VersionFitPromptProps {
  listedVersion: string;
  disabled?: boolean;
  otherVersion: string;
  onOtherVersionChange: (value: string) => void;
  onConfirmListed: () => void;
  onSubmitOther: () => void;
  onBack: () => void;
}

export default function VersionFitPrompt({
  listedVersion,
  disabled = false,
  otherVersion,
  onOtherVersionChange,
  onConfirmListed,
  onSubmitOther,
  onBack
}: VersionFitPromptProps) {
  const label = listedVersion.trim() || "the listed version";
  const otherOk = Boolean(otherVersion.trim());

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#c6d4df]">
        Giveaway keys are often version-specific. Developers commonly drop them right before a new release, so a key
        may fail on the latest build even if it still works on the listed version.
      </p>
      <p className="text-sm text-[#8f98a0]">
        Did you try <span className="font-medium text-[#c6d4df]">{label}</span> or older?
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={onConfirmListed}
        className="w-full cursor-pointer rounded-sm bg-[#1a3a5c] px-4 py-2.5 text-sm font-medium text-[#c6d4df] transition-colors hover:bg-[#213246] hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
        Yes, that version or older
      </button>
      <div className="space-y-2">
        <label className="block text-xs text-[#8f98a0]" htmlFor="tried-other-version">
          No — I tried a different version
        </label>
        <input
          id="tried-other-version"
          value={otherVersion}
          disabled={disabled}
          maxLength={40}
          placeholder="e.g. 12.4"
          onChange={e => onOtherVersionChange(e.target.value)}
          className="w-full rounded-sm border border-[#2a475e] bg-[#32465a] px-3 py-2 text-sm text-[#c6d4df] placeholder:text-[#556772] focus:border-[#66c0f4] focus:outline-none"
        />
        <button
          type="button"
          disabled={disabled || !otherOk}
          onClick={onSubmitOther}
          className="w-full cursor-pointer rounded-sm bg-[#32465a] px-4 py-2 text-sm font-medium text-[#c6d4df] transition-colors hover:bg-[#3d5770] hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
          Submit with that version
        </button>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onBack}
        className="w-full cursor-pointer text-center text-xs text-[#556772] hover:text-[#8f98a0] disabled:cursor-not-allowed">
        Back
      </button>
    </div>
  );
}
