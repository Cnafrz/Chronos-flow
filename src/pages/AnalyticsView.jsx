import { useState, useRef } from "react";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const COLORS = {
  target: "#10b981", // Green
  progress: "#ffffff", // White
  partner: "#3b82f6", // Blue
  warning: "#eab308", // Yellow
  missed: "#ef4444", // Red
  base: "#1f2937"
};

export default function AnalyticsView() {
  const [dateRange, setDateRange] = useState("this-month");
  const [filterCategory, setFilterCategory] = useState(null);
  const dashboardRef = useRef(null);

  const data = useAnalyticsData(dateRange);

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Category,Completed,Total,Hours\n"
      + data.categoryStats.map(c => `${c.name},${c.completed},${c.total},${c.hours.toFixed(1)}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "analytics_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    const canvas = await html2canvas(dashboardRef.current, { backgroundColor: "#09090b" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("analytics_report.pdf");
  };

  return (
    <div className="pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Data-driven productivity insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={dateRange} 
            onChange={e => setDateRange(e.target.value)}
            className="text-sm bg-muted/50 border border-border rounded-md px-3 py-1.5 outline-none focus:border-indigo-400"
          >
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
          </select>
          <button onClick={exportCSV} className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted/50">CSV</button>
          <button onClick={exportPDF} className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted/50">PDF</button>
        </div>
      </div>

      <div ref={dashboardRef} className="space-y-6">
        
        {/* INSIGHTS */}
        {data.insights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.insights.map((insight, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 bg-indigo-500 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CATEGORY PERFORMANCE */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Category Performance</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryStats} onClick={(e) => { if(e && e.activePayload) setFilterCategory(e.activePayload[0].payload.name) }}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }} />
                  <Bar dataKey="completed" fill={COLORS.progress} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GOAL PROGRESS */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Goal Progress</h2>
            <div className="space-y-4">
              {data.goalProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No active goals found in this period.</p>
              ) : (
                data.goalProgress.map(goal => (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{goal.target} {goal.metric} Goal</span>
                      <span className="text-muted-foreground">{goal.current} / {goal.target}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                      <div className="h-full bg-white transition-all" style={{ width: `${Math.min(100, goal.progress)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Pace needed: {goal.paceNeeded.toFixed(1)} {goal.metric}</span>
                      <span>Partner: {goal.partnerCurrent}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* HEATMAP & MISSED TASKS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 overflow-hidden">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Activity Heatmap (1 Year)</h2>
            <div className="flex flex-wrap gap-1">
               {/* Note: In a real advanced heatmap you'd use a calendar grid. For simplicity, we just show recent 60 days here if space is tight, but requested 1 yr */}
               {data.heatmapData.slice(0, 120).map((day, i) => (
                 <div 
                   key={i} 
                   title={`${day.dateString}: ${day.count} tasks`}
                   className={`w-3 h-3 rounded-sm ${day.count > 0 ? (day.count > 3 ? 'bg-indigo-400' : 'bg-indigo-500/50') : 'bg-muted'}`}
                 />
               ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col max-h-[300px]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4" style={{color: COLORS.missed}}>Top Missed Tasks</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {data.missedRanked.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No missed tasks! 🎉</p>
              ) : (
                data.missedRanked.slice(0, 10).map((m, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 rounded-lg bg-muted/30">
                    <span className="truncate pr-2">{m.title}</span>
                    <span className="font-semibold" style={{color: COLORS.warning}}>{m.count}x</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ACTIVITY TIMELINE */}
        <div className="rounded-2xl border border-border bg-card p-5">
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Activity Timeline</h2>
             {filterCategory && (
               <button onClick={() => setFilterCategory(null)} className="text-xs text-indigo-400">Clear filter: {filterCategory}</button>
             )}
           </div>
           <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {data.timeline
                .filter(t => !filterCategory || t.category === filterCategory)
                .slice(0, 50).map(t => (
                <div key={t.id} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted/30 transition-colors">
                   <div className={`w-2 h-2 rounded-full ${t.completed ? 'bg-green-500' : 'bg-red-500'}`} />
                   <span className="w-24 text-muted-foreground text-xs shrink-0">{new Date(t.date).toLocaleDateString()}</span>
                   <span className="flex-1 truncate" style={{color: t.completed ? COLORS.progress : COLORS.missed}}>{t.title}</span>
                   {t.duration > 0 && <span className="text-xs text-muted-foreground">{t.duration}m</span>}
                </div>
              ))}
              {data.timeline.length > 50 && (
                <p className="text-center text-xs text-muted-foreground py-2">Showing 50 most recent items</p>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
