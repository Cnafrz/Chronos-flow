import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Check, Clock, Play, Plus, Search, Square, StopCircle, Trash2, CalendarRange, GripVertical, ChevronDown } from "lucide-react";
import CategoryManager from "@/components/CategoryManager";
import { useTasks } from "@/hooks/useTasks";
import { CATEGORIES, DURATIONS } from "@/lib/categories";
import WeeklyDashboard from "@/components/WeeklyDashboard";
import BackupBar from "@/components/BackupBar";
import DurationInput from "@/components/DurationInput";
import TimeInput from "@/components/TimeInput";
import { reorder } from "@/lib/utils";

const WEEKDAYS = [
  { key: "saturday", label: "شنبه" },
  { key: "sunday", label: "یکشنبه" },
  { key: "monday", label: "دوشنبه" },
  { key: "tuesday", label: "سه‌شنبه" },
  { key: "wednesday", label: "چهارشنبه" },
  { key: "thursday", label: "پنجشنبه" },
  { key: "friday", label: "جمعه" }
];

export default function WeeklyView() {
  const t = useTasks();
  const [openDay, setOpenDay] = useState("saturday");

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Weekly schedule</h1>
              <CategoryManager />
            </div>
            <p className="text-muted-foreground mt-1">Edit recurring tasks and templates.</p>
          </div>
        </div>
        <BackupBar data={t.data} onImport={t.importData} />
      </div>

      <WeeklyDashboard />

      {/* Weekday accordions */}
      <div className="space-y-2 mb-10">
        {WEEKDAYS.map((day) => {
          const isOpen = openDay === day.key;
          const tasks = t.data.weeklySchedule[day.key] || [];
          return (
            <div key={day.key} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setOpenDay(isOpen ? null : day.key)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-sm flex items-center gap-2">
                  {day.label}
                  <span className="text-xs text-muted-foreground font-normal">
                    {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                  </span>
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-2 pb-2">
                  <DragDropContext onDragEnd={(res) => {
                    if (!res.destination) return;
                    t.reorderWeekly(day.key, reorder(tasks, res.source.index, res.destination.index));
                  }}>
                    <Droppable droppableId={`day-${day.key}`}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          {tasks.map((task, idx) => (
                            <Draggable key={task.id} draggableId={task.id} index={idx}>
                              {(prov) => (
                                <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40">
                                  <span {...prov.dragHandleProps} className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
                                    <GripVertical className="w-4 h-4" />
                                  </span>
                                  <TaskEditor
                                    task={task}
                                    onTitle={(v) => t.updateWeeklyTask(task.id, { title: v })}
                                    onStart={(v) => t.updateWeeklyTask(task.id, { startTime: v })}
                                    onEnd={(v) => t.updateWeeklyTask(task.id, { endTime: v })}
                                    onCategory={(v) => t.updateWeeklyTask(task.id, { category: v })}
                                    onDuration={(v) => t.updateWeeklyTask(task.id, { duration: v })}
                                    onDelete={() => t.deleteWeeklyTask(task.id)}
                                    categories={t.categories}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  <button onClick={() => t.addWeeklyTask(day.key)} className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:opacity-80 px-3 py-2 transition-opacity">
                    <Plus className="w-4 h-4" /> Add task
                  </button>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Flexible templates */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
          Flexible task templates
        </h2>
        <div className="rounded-xl border border-border bg-card p-2">
          <DragDropContext onDragEnd={(res) => {
            if (!res.destination) return;
            t.reorderTemplates(reorder(t.data.flexibleTemplates, res.source.index, res.destination.index));
          }}>
            <Droppable droppableId="templates">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {t.data.flexibleTemplates.map((tpl, idx) => (
                    <Draggable key={tpl.id} draggableId={tpl.id} index={idx}>
                      {(prov) => (
                        <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40">
                          <span {...prov.dragHandleProps} className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
                            <GripVertical className="w-4 h-4" />
                          </span>
                          <TemplateEditor
                            tpl={tpl}
                            onTitle={(v) => t.updateTemplate(tpl.id, { title: v })}
                            onCategory={(v) => t.updateTemplate(tpl.id, { category: v })}
                            onDuration={(v) => t.updateTemplate(tpl.id, { duration: v })}
                            onDelete={() => t.deleteTemplate(tpl.id)}
                            categories={t.categories}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <button onClick={t.addTemplate} className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:opacity-80 px-3 py-2 transition-opacity">
            <Plus className="w-4 h-4" /> Add template
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 px-1">
          Templates are never removed when used on your daily checklist.
        </p>
      </section>
    </div>
  );
}

function CategorySelect({ value, onChange, categories = [] }) {
  const options = [
    ...CATEGORIES,
    ...categories.map((category) => ({ key: category.id, label: category.name, emoji: category.icon }))
  ];

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="text-xs bg-muted/50 border border-border rounded-md px-1.5 py-1 outline-none focus:border-indigo-400 max-w-[120px]"
    >
      <option value="">No category</option>
      {options.map((c) => (
        <option key={c.key} value={c.key}>
          {c.emoji} {c.label}
        </option>
      ))}
    </select>
  );
}

export function calcDurationMins(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

function TaskEditor({ task, onTitle, onStart, onEnd, onCategory, onDuration, onDelete, categories }) {
  const [title, setTitle] = useState(task.title || "");

  useEffect(() => {
    setTitle(task.title || "");
  }, [task.id, task.title]);

  const saveTitle = () => {
    const nextTitle = title.trim();
    if (nextTitle && nextTitle !== task.title) onTitle(nextTitle);
    else if (!nextTitle) setTitle(task.title || "");
  };

  const handleTimeChange = (type, val) => {
    const newStart = type === 'start' ? val : task.startTime;
    const newEnd = type === 'end' ? val : task.endTime;
    if (type === 'start') onStart(val);
    else onEnd(val);

    if (newStart && newEnd && (!task.duration || task.duration === calcDurationMins(task.startTime, task.endTime))) {
       const newDuration = calcDurationMins(newStart, newEnd);
       if (newDuration && newDuration !== task.duration) {
         onDuration(newDuration);
       }
    }
  };

  return (
    <div className="flex-1 flex flex-wrap items-center gap-2 py-1">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        className="flex-1 min-w-[100px] bg-transparent text-sm outline-none rounded-md px-2 py-1 focus:bg-muted/60"
      />
      <CategorySelect value={task.category} onChange={onCategory} categories={categories} />
      <DurationInput value={task.duration} onChange={onDuration} />
      <TimeInput value={task.startTime} onChange={(v) => handleTimeChange('start', v)} />
      <span className="text-muted-foreground text-xs">–</span>
      <TimeInput value={task.endTime} onChange={(v) => handleTimeChange('end', v)} />
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors p-1">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function TemplateEditor({ tpl, onTitle, onCategory, onDuration, onDelete, categories }) {
  const [title, setTitle] = useState(tpl.title || "");

  useEffect(() => {
    setTitle(tpl.title || "");
  }, [tpl.id, tpl.title]);

  const saveTitle = () => {
    const nextTitle = title.trim();
    if (nextTitle && nextTitle !== tpl.title) onTitle(nextTitle);
    else if (!nextTitle) setTitle(tpl.title || "");
  };

  return (
    <div className="flex-1 flex flex-wrap items-center gap-2 py-1">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        className="flex-1 min-w-[100px] bg-transparent text-sm outline-none rounded-md px-2 py-1 focus:bg-muted/60"
      />
      <CategorySelect value={tpl.category} onChange={onCategory} categories={categories} />
      <DurationInput value={tpl.duration} onChange={onDuration} />
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors p-1">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
