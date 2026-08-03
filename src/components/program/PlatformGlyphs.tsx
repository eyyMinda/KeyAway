/** Four-pane mark (Windows-style tile). */
export function WindowsGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M0 2.3L6.8 1.3v6.4H0V2.3zm7.6-.9L16 0v8H7.6V1.4zM0 9.3h6.8V16L0 14.9V9.3zm7.6.1H16V16l-8.4-1.2V9.4z"
      />
    </svg>
  );
}

/** Apple mark for macOS. */
export function MacGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12.07 8.44c-.03-1.86 1.52-2.75 1.59-2.8-0.87-1.27-2.22-1.44-2.7-1.46-1.15-.12-2.25.68-2.83.68-.59 0-1.5-.66-2.47-.64-1.27.02-2.44.74-3.09 1.88-1.32 2.29-.34 5.68.95 7.54.63.91 1.38 1.93 2.37 1.89.95-.04 1.31-.61 2.46-.61 1.15 0 1.47.61 2.48.59 1.03-.02 1.68-.93 2.3-1.84.72-1.05 1.02-2.07 1.04-2.12-.02-.01-2-.77-2.02-3.05zm-1.9-5.5c.53-.64.89-1.53.79-2.42-.76.03-1.68.51-2.22 1.15-.49.57-.92 1.48-.8 2.35.85.07 1.71-.43 2.23-1.08z"
      />
    </svg>
  );
}
