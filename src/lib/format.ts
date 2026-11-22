const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function timeAgo(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return 'Never';

  const diff = now - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '—';
  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} d ago`;
  return formatDate(iso);
}

export function minutesUntil(epochSeconds: number | undefined, now = Date.now()) {
  if (!epochSeconds) return null;
  return Math.max(0, Math.round((epochSeconds * 1000 - now) / MINUTE));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(fullName: string | null, email: string) {
  return fullName?.trim().split(/\s+/)[0] || email.split('@')[0];
}
