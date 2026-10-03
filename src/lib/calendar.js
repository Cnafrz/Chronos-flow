import { toJalaali, toGregorian } from "jalaali-js";

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
  if (!date || Number.isNaN(date.getTime())) return "";
  if (system !== "jalali") return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
  const { jy, jm } = toJalaali(date);
  return `${PERSIAN_MONTHS[jm - 1]} ${jy}`;
}

export function weekdayLabel(value, system = "jalali") {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  if (system !== "jalali") return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  const index = (date.getDay() + 1) % 7;
  return PERSIAN_WEEKDAYS[index];
}

export function prevMonth(value = new Date(), system = "jalali") {
  const date = toDate(value) || new Date();
  if (system === "jalali") {
    const { jy, jm } = toJalaali(date);
    const prevJy = jm === 1 ? jy - 1 : jy;
    const prevJm = jm === 1 ? 12 : jm - 1;
    const { gy, gm, gd } = toGregorian(prevJy, prevJm, 1);
    return new Date(gy, gm - 1, gd, 12, 0, 0);
  }
  return new Date(date.getFullYear(), date.getMonth() - 1, 1, 12, 0, 0);
}

export function nextMonth(value = new Date(), system = "jalali") {
  const date = toDate(value) || new Date();
  if (system === "jalali") {
    const { jy, jm } = toJalaali(date);
    const nextJy = jm === 12 ? jy + 1 : jy;
    const nextJm = jm === 12 ? 1 : jm + 1;
    const { gy, gm, gd } = toGregorian(nextJy, nextJm, 1);
    return new Date(gy, gm - 1, gd, 12, 0, 0);
  }
  return new Date(date.getFullYear(), date.getMonth() + 1, 1, 12, 0, 0);
}

export function isSameMonth(dateA, dateB, system = "jalali") {
  const a = toDate(dateA);
  const b = toDate(dateB);
  if (!a || !b) return false;
  if (system === "jalali") {
    const ja = toJalaali(a);
    const jb = toJalaali(b);
    return ja.jy === jb.jy && ja.jm === jb.jm;
  }
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatDayNumber(value, system = "jalali") {
  const date = toDate(value);
  if (!date) return "";
  if (system === "jalali") {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric" }).format(date);
  }
  return String(date.getDate());
}

export function monthGrid(value = new Date(), system = "jalali") {
  const date = toDate(value) || new Date();
  if (system === "jalali") {
    const { jy, jm } = toJalaali(date);
    const { gy, gm, gd } = toGregorian(jy, jm, 1);
    const first = new Date(gy, gm - 1, gd, 12, 0, 0);
    // Jalali week starts on Saturday (which is getDay() === 6 -> index 0)
    const startOffset = (first.getDay() + 1) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - startOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      return d;
    });
  }
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0);
  const startOffset = (first.getDay() + 1) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    return d;
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

