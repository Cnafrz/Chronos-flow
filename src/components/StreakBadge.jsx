import { Flame } from "lucide-react";

export default function StreakBadge({ streak }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Flame className={`w-4 h-4 ${streak > 0 ? "text-orange-500" : "text-muted-foreground/40"}`} fill={streak > 0 ? "currentColor" : "none"} />
      <span className={`font-semibold tabular-nums ${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`}>
        {streak}
      </span>
      <span className="text-muted-foreground text-xs">{streak === 1 ? "day streak" : "day streak"}</span>
    </div>
  );
}