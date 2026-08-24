import { useState, useEffect } from "react";

export default function TimeInput({ value, onChange }) {
  const [text, setText] = useState(value || "");

  useEffect(() => {
    setText(value || "");
  }, [value]);

  const handleBlur = () => {
    let input = text.trim();
    if (!input) {
      if (value) onChange("");
      setText("");
      return;
    }

    // Attempt to parse input as HH:MM or HHMM
    const match = input.match(/^(\d{1,2})[:.]?(\d{2})?$/);
    if (match) {
      let h = parseInt(match[1], 10);
      let m = match[2] ? parseInt(match[2], 10) : 0;
      
      // Basic bounds check
      if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        if (formatted !== value) onChange(formatted);
        setText(formatted);
        return;
      }
    }
    
    // Revert if invalid
    setText(value || "");
  };

  return (
    <input
      type="text"
      placeholder="--:--"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      className="text-xs bg-muted/50 border border-border rounded-md px-2 py-1 outline-none focus:border-indigo-400 w-16 text-center tabular-nums"
    />
  );
}
