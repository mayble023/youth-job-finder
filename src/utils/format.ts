import { differenceInCalendarDays, format, formatDistanceToNow, parseISO } from 'date-fns';

/** 42000 → "42,000". Done by hand so it does not depend on the phone's Intl support. */
function withThousands(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Salaries are stored as PGK per year. */
export function formatSalaryRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'Salary not stated';
  if (min !== null && max !== null) {
    return min === max
      ? `PGK ${withThousands(min)} / year`
      : `PGK ${withThousands(min)} – ${withThousands(max)} / year`;
  }
  if (min !== null) return `From PGK ${withThousands(min)} / year`;
  return `Up to PGK ${withThousands(max ?? 0)} / year`;
}

/** "Closes today", "Closes in 5 days", "Closes 12 Dec 2026", or "Closed". */
export function formatClosingDate(closingDate: string | null, now = new Date()): string {
  if (!closingDate) return 'No closing date';
  // parseISO reads a plain date as local midnight, so day counts match the user's calendar.
  const date = parseISO(closingDate);
  const daysLeft = differenceInCalendarDays(date, now);

  if (daysLeft < 0) return 'Closed';
  if (daysLeft === 0) return 'Closes today';
  if (daysLeft === 1) return 'Closes tomorrow';
  if (daysLeft <= 7) return `Closes in ${daysLeft} days`;
  return `Closes ${format(date, 'd MMM yyyy')}`;
}

/** "5 minutes ago" for the offline banner on cached lists. */
export function formatTimeAgo(isoTimestamp: string): string {
  return formatDistanceToNow(parseISO(isoTimestamp), { addSuffix: true });
}
