const DAY_MS = 86_400_000;

/** Pro links are stored with an expiry roughly 100 years out; anything past 10 years counts as permanent. */
const PERMANENT_AFTER_DAYS = 3650;

export function isExpired(expiresAt: string | null): boolean {
  return !!expiresAt && new Date(expiresAt).getTime() < Date.now();
}

export function daysUntilExpiry(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / DAY_MS);
}

export function isPermanent(expiresAt: string): boolean {
  return daysUntilExpiry(expiresAt) > PERMANENT_AFTER_DAYS;
}

export function expiryNote(
  expiresAt: string | null,
): { text: string; urgent: boolean } | null {
  if (!expiresAt) return null;
  if (isExpired(expiresAt)) return { text: 'Expired', urgent: true };
  if (isPermanent(expiresAt)) return { text: 'Never expires', urgent: false };
  const days = daysUntilExpiry(expiresAt);
  return {
    text: days <= 1 ? 'Expires within a day' : `Expires in ${days} days`,
    urgent: days <= 7,
  };
}
