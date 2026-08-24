import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { subDays, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";

export function useAnalyticsData(dateRange, customDates) {
  const { tasks, partnerTasks, goals, templates, categories } = useAppStore();

  return useMemo(() => {
    const now = new Date();
    
    // 1. Filter tasks by Date Range
    let startDate, endDate;
    if (dateRange === "today") {
      startDate = startOfDay(now); endDate = endOfDay(now);
    } else if (dateRange === "this-week") {
      startDate = startOfWeek(now, { weekStartsOn: 1 }); endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else if (dateRange === "this-month") {
      startDate = startOfMonth(now); endDate = endOfMonth(now);
    } else if (dateRange === "last-month") {
      const prevMonth = subDays(startOfMonth(now), 1);
      startDate = startOfMonth(prevMonth); endDate = endOfMonth(prevMonth);
    } else if (dateRange === "this-year") {
      startDate = startOfYear(now); endDate = endOfYear(now);
    } else if (dateRange === "custom" && customDates?.start && customDates?.end) {
      startDate = startOfDay(customDates.start); endDate = endOfDay(customDates.end);
    } else {
      startDate = startOfMonth(now); endDate = endOfMonth(now);
    }

    const isDateInRange = (d) => {
      const date = new Date(d);
      return isWithinInterval(date, { start: startDate, end: endDate });
    };

    const filteredTasks = tasks.filter(t => t.date && isDateInRange(t.date));
    const completedTasks = filteredTasks.filter(t => t.completed);
    
    // Timeline
    const timeline = [...filteredTasks].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Heatmap (Last 365 Days)
    const heatmapData = [];
    const oneYearAgo = subDays(now, 365);
    const lastYearTasks = tasks.filter(t => t.completed && new Date(t.date) >= oneYearAgo);
    const heatmapCounts = lastYearTasks.reduce((acc, t) => {
      acc[t.date] = (acc[t.date] || 0) + 1;
      return acc;
    }, {});
    
    for (let i = 365; i >= 0; i--) {
      const d = subDays(now, i);
      const ds = d.toDateString();
      heatmapData.push({ date: d, count: heatmapCounts[ds] || 0, dateString: ds });
    }

    // Category Performance
    const catMap = categories.reduce((acc, c) => ({ ...acc, [c.id]: { ...c, completed: 0, total: 0, hours: 0 } }), {});
    filteredTasks.forEach(t => {
      const catId = t.category || "uncategorized";
      if (!catMap[catId]) catMap[catId] = { name: catId, completed: 0, total: 0, hours: 0 };
      catMap[catId].total += 1;
      if (t.completed) {
        catMap[catId].completed += 1;
        catMap[catId].hours += (t.duration || 0) / 60;
      }
    });
    const categoryStats = Object.values(catMap).filter(c => c.total > 0)
      .map(c => ({ ...c, rate: Math.round((c.completed / c.total) * 100) }))
      .sort((a, b) => b.completed - a.completed);

    // Missed Tasks
    const missed = filteredTasks.filter(t => !t.completed && new Date(t.date) < startOfDay(now));
    const missedCounts = missed.reduce((acc, t) => {
      acc[t.title] = (acc[t.title] || 0) + 1;
      return acc;
    }, {});
    const missedRanked = Object.entries(missedCounts).map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count);

    // Goal Progress Engine
    const goalProgress = goals.map(g => {
      const gTasks = tasks.filter(t => t.templateId === g.templateId && t.completed && isDateInRange(t.date));
      const gPartner = partnerTasks.filter(t => t.templateId === g.templateId && t.completed && isDateInRange(t.date));
      
      const current = g.metric === "hours" ? gTasks.reduce((s, t) => s + (t.duration || 0)/60, 0) : gTasks.length;
      const partnerCurrent = g.metric === "hours" ? gPartner.reduce((s, t) => s + (t.duration || 0)/60, 0) : gPartner.length;
      const target = Number(g.target);
      
      const progressRatio = target > 0 ? (current / target) : 0;
      const paceNeeded = target - current; // simple calculation

      return {
        ...g,
        current,
        partnerCurrent,
        target,
        paceNeeded: paceNeeded > 0 ? paceNeeded : 0,
        progress: progressRatio * 100
      };
    });

    // Insights Generation
    const insights = [];
    if (missedRanked.length > 0) {
      insights.push(`You often miss "${missedRanked[0].title}". Consider adjusting its schedule or breaking it down.`);
    }
    if (categoryStats.length > 0) {
      insights.push(`"${categoryStats[0].name}" is your strongest category this period with ${categoryStats[0].completed} tasks completed.`);
    }
    if (completedTasks.length > 0) {
       insights.push(`You've completed ${completedTasks.length} tasks in this period. Keep the momentum going!`);
    }

    return {
      filteredTasks,
      completedTasks,
      categoryStats,
      timeline,
      heatmapData,
      missedRanked,
      goalProgress,
      insights
    };
  }, [tasks, partnerTasks, goals, categories, dateRange, customDates]);
}
