export const CATEGORIES = [
  { key: "programming", label: "Programming", emoji: "💻", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", dot: "bg-blue-500" },
  { key: "music", label: "Music", emoji: "🎸", cls: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300", dot: "bg-purple-500" },
  { key: "business", label: "Business", emoji: "💼", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", dot: "bg-amber-500" },
  { key: "creative", label: "Creative", emoji: "🎨", cls: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300", dot: "bg-pink-500" },
  { key: "personal", label: "Personal", emoji: "🏠", cls: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300", dot: "bg-green-500" },
];

const MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

export function getCategory(key) {
  return MAP[key] || null;
}

export const DURATIONS = [
  { value: null, label: "—" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 h" },
  { value: 90, label: "1.5 h" },
  { value: 120, label: "2 h" },
];

export function formatDuration(min) {
  if (!min) return null;
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}