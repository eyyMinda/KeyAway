// Date formatting utilities

// Format date for display (e.g., "Jan 15, 2024, 2:30 PM")
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Format date for display with time only (e.g., "2:30 PM")
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Format date for display with date only (e.g., "Jan 15, 2024")
export function formatDateOnly(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

const MS = { min: 60_000, hour: 3_600_000, day: 86_400_000 };

function getRelativeParts(iso?: string): { d: Date; mins: number; hours: number; days: number } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  return {
    d,
    mins: Math.floor(diffMs / MS.min),
    hours: Math.floor(diffMs / MS.hour),
    days: Math.floor(diffMs / MS.day)
  };
}

const s = (n: number) => (n === 1 ? "" : "s");

/** Compact relative time for notifications/badges (e.g. "2m ago", "5h ago", "3d ago", "Jan 15") */
export function formatRelativeTimeCompact(iso?: string): string {
  const p = getRelativeParts(iso);
  if (!p) return "";
  if (p.mins < 1) return "just now";
  if (p.mins < 60) return `${p.mins}m ago`;
  if (p.hours < 24) return `${p.hours}h ago`;
  if (p.days < 7) return `${p.days}d ago`;
  return p.d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(p.d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {})
  });
}

/** Format date with relative time (e.g. "2 hours ago", "3 days ago") */
export function formatRelativeTime(dateString: string): string {
  const p = getRelativeParts(dateString);
  if (!p) return dateString;
  if (p.mins < 1) return "just now";
  if (p.mins < 60) return `${p.mins} minute${s(p.mins)} ago`;
  if (p.hours < 24) return `${p.hours} hour${s(p.hours)} ago`;
  if (p.days < 7) return `${p.days} day${s(p.days)} ago`;
  const weeks = Math.floor(p.days / 7);
  if (weeks < 4) return `${weeks} week${s(weeks)} ago`;
  const months = Math.floor(p.days / 30);
  if (months < 12) return `${months} month${s(months)} ago`;
  const years = Math.floor(p.days / 365);
  return `${years} year${s(years)} ago`;
}

// Get current timestamp in ISO format
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// Check if a date is today
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Check if a date is yesterday
export function isYesterday(dateString: string): boolean {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

// Format date with smart display (today, yesterday, or formatted date)
export function formatSmartDate(dateString: string): string {
  if (isToday(dateString)) {
    return `Today at ${formatTime(dateString)}`;
  }

  if (isYesterday(dateString)) {
    return `Yesterday at ${formatTime(dateString)}`;
  }

  return formatDate(dateString);
}
