// =============================================================================
// Date Utilities
// =============================================================================

import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  addDays,
  addWeeks,
  addMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isAfter,
  isBefore,
  isWithinInterval,
} from 'date-fns';

export type DateInput = Date | string | number;

export function toDate(input: DateInput): Date {
  if (input instanceof Date) return input;
  if (typeof input === 'string') return parseISO(input);
  return new Date(input);
}

export function isValidDate(input: DateInput): boolean {
  return isValid(toDate(input));
}

// Formatting
export function formatDate(input: DateInput, formatStr = 'MMM d, yyyy'): string {
  return format(toDate(input), formatStr);
}

export function formatDateTime(input: DateInput): string {
  return format(toDate(input), 'MMM d, yyyy h:mm a');
}

export function formatTime(input: DateInput): string {
  return format(toDate(input), 'h:mm a');
}

export function formatRelative(input: DateInput, addSuffix = true): string {
  return formatDistanceToNow(toDate(input), { addSuffix });
}

export function formatISO(input: DateInput): string {
  return toDate(input).toISOString();
}

export function formatDateForAPI(input: DateInput): string {
  return format(toDate(input), 'yyyy-MM-dd');
}

// Date ranges
export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRange(
  period:
    | 'today'
    | 'yesterday'
    | 'this_week'
    | 'last_week'
    | 'this_month'
    | 'last_month'
    | 'this_quarter'
    | 'last_quarter'
    | 'this_year'
    | 'last_year'
    | 'last_7_days'
    | 'last_30_days'
    | 'last_90_days'
): DateRange {
  const now = new Date();

  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };

    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };

    case 'this_week':
      return { start: startOfWeek(now), end: endOfWeek(now) };

    case 'last_week':
      const lastWeek = subWeeks(now, 1);
      return { start: startOfWeek(lastWeek), end: endOfWeek(lastWeek) };

    case 'this_month':
      return { start: startOfMonth(now), end: endOfMonth(now) };

    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };

    case 'this_quarter':
      return { start: startOfQuarter(now), end: endOfQuarter(now) };

    case 'last_quarter':
      const lastQuarter = subMonths(now, 3);
      return { start: startOfQuarter(lastQuarter), end: endOfQuarter(lastQuarter) };

    case 'this_year':
      return { start: startOfYear(now), end: endOfYear(now) };

    case 'last_year':
      const lastYear = subYears(now, 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };

    case 'last_7_days':
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };

    case 'last_30_days':
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };

    case 'last_90_days':
      return { start: startOfDay(subDays(now, 89)), end: endOfDay(now) };

    default:
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
  }
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const days = differenceInDays(range.end, range.start) + 1;
  return {
    start: subDays(range.start, days),
    end: subDays(range.end, days),
  };
}

// Comparisons
export function isDateAfter(date: DateInput, compareDate: DateInput): boolean {
  return isAfter(toDate(date), toDate(compareDate));
}

export function isDateBefore(date: DateInput, compareDate: DateInput): boolean {
  return isBefore(toDate(date), toDate(compareDate));
}

export function isDateInRange(date: DateInput, range: DateRange): boolean {
  return isWithinInterval(toDate(date), { start: range.start, end: range.end });
}

export function isExpired(date: DateInput): boolean {
  return isBefore(toDate(date), new Date());
}

export function isUpcoming(date: DateInput): boolean {
  return isAfter(toDate(date), new Date());
}

// Differences
export function getDaysDifference(start: DateInput, end: DateInput): number {
  return differenceInDays(toDate(end), toDate(start));
}

export function getHoursDifference(start: DateInput, end: DateInput): number {
  return differenceInHours(toDate(end), toDate(start));
}

export function getMinutesDifference(start: DateInput, end: DateInput): number {
  return differenceInMinutes(toDate(end), toDate(start));
}

// Modifications
export function addDaysToDate(date: DateInput, days: number): Date {
  return addDays(toDate(date), days);
}

export function addWeeksToDate(date: DateInput, weeks: number): Date {
  return addWeeks(toDate(date), weeks);
}

export function addMonthsToDate(date: DateInput, months: number): Date {
  return addMonths(toDate(date), months);
}

// Time zones
export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return (local.getTime() - utc.getTime()) / (1000 * 60);
  } catch {
    return 0;
  }
}

export function formatInTimezone(date: DateInput, timezone: string, formatStr = 'MMM d, yyyy h:mm a'): string {
  const d = toDate(date);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return d.toLocaleString('en-US', options);
}

// Business days
export function isWeekend(date: DateInput): boolean {
  const day = toDate(date).getDay();
  return day === 0 || day === 6;
}

export function getBusinessDays(start: DateInput, end: DateInput): number {
  let count = 0;
  let current = toDate(start);
  const endDate = toDate(end);

  while (current <= endDate) {
    if (!isWeekend(current)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}
