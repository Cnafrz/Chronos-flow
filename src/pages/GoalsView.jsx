import { useMemo, useState } from "react";
import { Plus, Trash2, Target } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function GoalsView() {
  const { goals, templates, tasks, addGoal, deleteGoal } = useAppStore();
  const [form, setForm] = useState(null);
  
  const progress = useMemo(() => goals.map((goal) => { 
    const completed = tasks.filter((task) => task.completed && task.templateId === goal.templateId); 
    const value = goal.metric === "hours" ? completed.reduce((sum, task) => sum + (task.duration || 0), 0) / 60 : completed.length; 
    return { ...goal, value, percent: Math.min(100, Math.round((value / goal.target) * 100)) }; 
  }), [goals, tasks]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Goals</h1>
          <p className="text-muted-foreground mt-1">Track progress from completed flexible tasks.</p>
        </div>
        <button onClick={() => setForm({ templateId: templates[0]?.id || "", target: 10, metric: "completions", period: "monthly" })} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {!goals.length && !form && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Target className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">No goals set</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">Create a goal linked to a flexible template to track your long-term progress.</p>
          <button onClick={() => setForm({ templateId: templates[0]?.id || "", target: 10, metric: "completions", period: "monthly" })} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {progress.map((goal) => {
          const radius = 35;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference - (goal.percent / 100) * circumference;
          
          return (
            <div key={goal.id} className="rounded-2xl border bg-card p-6 flex items-center justify-between group">
              <div>
                <p className="font-semibold text-lg mb-1">{templates.find((item) => item.id === goal.templateId)?.title || "Deleted template"}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {Math.round(goal.value)} / {goal.target} {goal.metric === "hours" ? "hrs" : "sessions"} <span className="uppercase text-xs tracking-wider opacity-70 ml-1">· {goal.period}</span>
                </p>
                <button onClick={() => deleteGoal(goal.id)} className="text-sm text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
              <div className="relative shrink-0 flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    className="text-muted"
                    strokeWidth="6"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="48"
                    cy="48"
                  />
                  <circle
                    className="text-indigo-500 transition-all duration-1000 ease-in-out"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="48"
                    cy="48"
                  />
                </svg>
                <span className="absolute text-sm font-semibold">{goal.percent}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {form && (
        <form onSubmit={(e) => { e.preventDefault(); if (form.templateId) { addGoal(form); setForm(null); } }} className="mt-8 max-w-md mx-auto rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg">New goal</h2>
            <button type="button" onClick={() => setForm(null)} className="text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Template</label>
            <select value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })} className="w-full border border-border rounded-lg p-2.5 bg-background text-sm">
              {templates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Target</label>
              <input type="number" min="1" value={form.target} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} className="w-full border border-border rounded-lg p-2.5 bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Metric</label>
              <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className="w-full border border-border rounded-lg p-2.5 bg-background text-sm">
                <option value="completions">Sessions</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Period</label>
            <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="w-full border border-border rounded-lg p-2.5 bg-background text-sm">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <button className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-medium mt-2">Save goal</button>
        </form>
      )}
    </div>
  );
}
