import { forwardRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, X, GripVertical, Timer, Target } from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import { formatDuration } from "@/lib/categories";

const ChecklistRow = memo(forwardRef(function ChecklistRow(
  { item, draggableProps, dragHandleProps, onToggle, onPin, onRemove },
  ref
) {
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      {...draggableProps}
      className={`group flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors ${
        item.pinned ? "ring-1 ring-indigo-300 dark:ring-indigo-800" : ""
      } ${item.completed ? "opacity-55" : "hover:border-foreground/20"}`}
    >
      <span
        {...dragHandleProps}
        className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </span>
      <button
        onClick={() => onToggle(item.id)}
        className={`relative shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
          item.completed ? "bg-indigo-500 border-indigo-500" : "border-border hover:border-indigo-400"
        }`}
      >
        <AnimatePresence>
          {item.completed && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {item.completed && (
            <motion.div
              className="absolute inset-0 rounded-md border border-indigo-500"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </button>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={`text-sm truncate ${item.completed ? "line-through text-muted-foreground" : ""}`}>
          {item.title}
        </span>
        <CategoryBadge category={item.category} />
      </div>
      {item.startTime && (
        <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Clock className="w-3 h-3" />
          {fmt(item.startTime)}{item.endTime ? `–${fmt(item.endTime)}` : ""}
        </span>
      )}
      {item.duration && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Timer className="w-3 h-3" />
          {formatDuration(item.duration)}
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPin(item.id);
        }}
        className={`p-1.5 rounded-lg transition-colors touch-manipulation cursor-pointer ${
          item.pinned
            ? "text-indigo-500"
            : "text-muted-foreground/40 hover:text-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        }`}
        aria-label={item.pinned ? "Remove from Today's Focus" : "Add to Today's Focus"}
      >
        <Target className="w-4 h-4" fill={item.pinned ? "currentColor" : "none"} />
      </button>
      {(item.source === "quick_capture" || item.source === "flexible" || (item.type === "instance" && !item.weeklyTaskId && !String(item.id).startsWith("calendar-"))) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-manipulation cursor-pointer"
          aria-label="Remove task"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}));

function fmt(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default ChecklistRow;