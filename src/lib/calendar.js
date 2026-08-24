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

export const calendarWeekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
