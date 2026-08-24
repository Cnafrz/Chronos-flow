import { useState, useEffect } from "react";

export function parseDurationToMinutes(str) {
  if (!str) return null;
  const match = str.toLowerCase().match(/^([\d.]+)\s*(h|hr|hours?|m|min|mins?|minutes?)?$/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  if (isNaN(val)) return null;
  const unit = match[2];
  if (unit && unit.startsWith('h')) {
    return Math.round(val * 60);
  }
  return Math.round(val);
}

export function formatDurationText(mins) {
  if (mins == null) return "";
  if (mins >= 60 && mins % 60 === 0) return `${mins / 60} h`;
  if (mins > 60 && mins % 60 !== 0) {
     const h = Math.floor(mins / 60);
     const m = mins % 60;
     return `${h} h ${m} min`;
  }
  return `${mins} min`;
}

export default function DurationInput({ value, onChange, placeholder = "Duration" }) {
  const [text, setText] = useState(formatDurationText(value));

  useEffect(() => {
    setText(formatDurationText(value));
  }, [value]);

  const handleBlur = () => {
    const mins = parseDurationToMinutes(text);
    if (mins !== null) {
      if (mins !== value) onChange(mins);
      setText(formatDurationText(mins));
    } else if (text.trim() === "") {
      if (value !== null) onChange(null);
      setText("");
    } else {
      // Revert if invalid
      setText(formatDurationText(value));
    }
  };

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      className="text-xs bg-muted/50 border border-border rounded-md px-2 py-1 outline-none focus:border-indigo-400 w-24"
    />
  );
}
