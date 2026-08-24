import { motion } from "framer-motion";

export { ProgressBar };
function ProgressBar({ completed, total }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums text-muted-foreground w-10 text-right">
        {pct}%
      </span>
    </div>
  );
}