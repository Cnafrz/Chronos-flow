import { BarChart3, CheckCircle2, Target, CalendarDays } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";

export default function WeeklyDashboard() {
  const { userProfile, tasks } = useAppStore();
  const history = userProfile?.history || {};

  const stats = useMemo(() => {
    let completedThisWeek = 0;
    let focusCompletedThisWeek = 0;
    let totalScheduled = 0;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const entry = history[key];
      
      const done = entry?.done || 0;
      const total = entry?.total || 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      
      completedThisWeek += done;
      totalScheduled += total;

      days.push({
        label: d.toLocaleDateString("en", { weekday: "narrow" }),
        pct,
        done,
        total,
        allCompleted: entry?.allCompleted,
      });
    }

    return { days, completedThisWeek, totalScheduled, focusCompletedThisWeek };
  }, [history, tasks]);

  const completionRate = stats.totalScheduled > 0 
    ? Math.round((stats.completedThisWeek / stats.totalScheduled) * 100) 
    : 0;

  return (
    <div className="mb-10 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Completed</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{stats.completedThisWeek}</span>
            <span className="text-sm text-muted-foreground">tasks</span>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Target className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Completion Rate</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{completionRate}%</span>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Scheduled</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{stats.totalScheduled}</span>
            <span className="text-sm text-muted-foreground">tasks</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-1.5 mb-6">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Weekly Activity
          </span>
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {stats.days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
              <div className="w-full flex-1 flex items-end justify-center">
                <div
                  className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ${
                    d.allCompleted ? "bg-gradient-to-t from-indigo-500 to-violet-500" : "bg-muted hover:bg-muted-foreground/30"
                  }`}
                  style={{ height: `${Math.max(d.pct, d.total > 0 ? 8 : 4)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{d.label}</span>
              
              {/* Tooltip */}
              <div className="absolute -top-10 bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg border">
                {d.done} / {d.total} done
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
