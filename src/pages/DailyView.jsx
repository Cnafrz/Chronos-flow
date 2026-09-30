import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { useTasks } from "@/hooks/useTasks";
import { useAppStore } from "@/store/useAppStore";
import { ProgressBar } from "@/components/ProgressBar";
import ChecklistRow from "@/components/ChecklistRow";
import TemplatePicker from "@/components/TemplatePicker";
import TodayFocus from "@/components/TodayFocus";
import StreakBadge from "@/components/StreakBadge";
import CategoryFilter from "@/components/CategoryFilter";
import { reorder } from "@/lib/utils";
import { getWeekdayLabel, calendarSystem } from "@/lib/calendar";
import { Plus } from "lucide-react";

export default function DailyView() {
  const t = useTasks();
  const { addTaskToToday, userProfile } = useAppStore();
  const [filter, setFilter] = useState("all");
  const [quickCapture, setQuickCapture] = useState("");
  const { width, height } = useWindowSize();

  const calSys = calendarSystem(userProfile?.settings);
  const todayLabel = getWeekdayLabel(new Date(), calSys);

  const { todayItems } = t;
  const completed = todayItems.filter((i) => i.completed).length;
  const isAllDone = todayItems.length > 0 && completed === todayItems.length;

  const handleQuickCapture = (e) => {
    e.preventDefault();
    if (!quickCapture.trim()) return;
    addTaskToToday(quickCapture.trim());
    setQuickCapture("");
  };

  const focusItems = [...todayItems]
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    .filter((i) => !i.completed)
    .slice(0, 3);

  const filtered =
    filter === "all" ? todayItems : todayItems.filter((i) => i.category === filter);

  return (
    <div>
      {isAllDone && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={400}
          gravity={0.2}
          initialVelocityY={20}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight capitalize">
              {todayLabel}
            </h1>
            <p className="text-muted-foreground mt-1">Your plan for today</p>
          </div>
          <div className="sm:hidden">
            <StreakBadge streak={t.streak} />
          </div>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <form onSubmit={handleQuickCapture} className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Quick capture..."
              value={quickCapture}
              onChange={(e) => setQuickCapture(e.target.value)}
              className="pl-4 pr-10 py-2 bg-secondary text-secondary-foreground rounded-full text-sm w-full sm:w-48 transition-all focus:sm:w-64 outline-none"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <Plus className="h-4 w-4" />
            </button>
          </form>
          <div className="hidden sm:block">
            <StreakBadge streak={t.streak} />
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Today's progress</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {completed} / {todayItems.length} done
          </span>
        </div>
        <ProgressBar completed={completed} total={todayItems.length} />
      </div>

      <TodayFocus items={focusItems} onToggle={t.toggleTask} />

      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
          Today's Checklist
        </h2>
        <div className="mb-4">
          <CategoryFilter selected={filter} onChange={setFilter} categories={t.categories} />
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            {todayItems.length === 0
              ? "No tasks yet. Add flexible tasks below."
              : "No tasks in this category."}
          </div>
        ) : (
          <DragDropContext
            onDragEnd={(res) => {
              if (!res.destination) return;
              const next = reorder(todayItems, res.source.index, res.destination.index);
              t.reorderToday(next);
            }}
          >
            <Droppable droppableId="today">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {filtered.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(prov) => (
                        <ChecklistRow
                          ref={prov.innerRef}
                          draggableProps={prov.draggableProps}
                          dragHandleProps={prov.dragHandleProps}
                          item={item}
                          onToggle={t.toggleTask}
                          onPin={t.pinTask}
                          onRemove={t.removeFlexibleFromToday}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      <TemplatePicker
        templates={t.data.flexibleTemplates}
        todayItems={todayItems}
        onToggle={t.toggleTemplateInToday}
        onSelectAll={t.addAllTemplates}
      />
    </div>
  );
}
