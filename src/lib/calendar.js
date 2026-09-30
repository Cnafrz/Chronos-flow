const PERSIAN_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const PERSIAN_WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

export function calendarSystem(settings) {
  return settings?.calendarSystem || "jalali";
}

export function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  return value instanceof Date ? value : new Date(value);
}

export function dateKey(value = new Date()) {
  const date = toDate(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dateFromKey(value) {
  return new Date(`${value}T12:00:00`);
}

export function dateRangeIncludes(event, value = new Date()) {
  const key = dateKey(value);
  return event.startDate <= key && (event.endDate || event.startDate) >= key;
}

export function formatCalendarDate(value, system = "jalali", options = {}) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  if (system === "jalali") {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric", month: "long", day: "numeric", ...options
    }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", ...options }).format(date);
}

export function calendarMonthLabel(value, system = "jalali") {
  const date = toDate(value);
  if (system !== "jalali") return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "numeric", year: "numeric" }).formatToParts(date);
  const month = Number(parts.find((part) => part.type === "month")?.value?.replace(/[^0-9۰-۹]/g, "").replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)) || 1);
  const year = parts.find((part) => part.type === "year")?.value || "";
  return `${PERSIAN_MONTHS[month - 1]} ${year}`;
}

export function weekdayLabel(value, system = "jalali") {
  const date = toDate(value);
  if (system !== "jalali") return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  const index = (date.getDay() + 1) % 7;
  return PERSIAN_WEEKDAYS[index];
}

export function monthGrid(value = new Date()) {
  const first = new Date(value.getFullYear(), value.getMonth(), 1);
  const startOffset = (first.getDay() + 1) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

// Jalali week starts on Saturday; order matches the calendar grid starting from Saturday.
const JALALI_WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
// Gregorian week starts on Saturday to match the same grid layout used throughout the app.
const GREGORIAN_WEEKDAYS_SHORT = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

/**
 * Returns the ordered array of 7 weekday header names for the calendar grid,
 * matching the active calendar system. Grid always starts Saturday.
 */
export function getWeekdayNames(system = "jalali") {
  return system === "jalali" ? JALALI_WEEKDAYS : GREGORIAN_WEEKDAYS_SHORT;
}

/**
 * Returns the display label for today's weekday in the correct locale.
 * Used on the Home/Daily page heading.
 * @param {Date} date
 * @param {"jalali"|"gregorian"} system
 */
export function getWeekdayLabel(date = new Date(), system = "jalali") {
  if (system === "jalali") {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long" }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
}

// Keep legacy export so any future external code doesn't hard-crash; points to Jalali default.
/** @deprecated Use getWeekdayNames(system) instead */
export const calendarWeekdays = JALALI_WEEKDAYS;

