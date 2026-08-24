import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTasks } from "@/hooks/useTasks";
import { ProgressBar } from "@/components/ProgressBar";
import ChecklistRow from "@/components/ChecklistRow";
import TemplatePicker from "@/components/TemplatePicker";
import TodayFocus from "@/components/TodayFocus";
import StreakBadge from "@/components/StreakBadge";
import CategoryFilter from "@/components/CategoryFilter";
import { reorder } from "@/lib/utils";

export default function DailyView() {
  const t = useTasks();
  const [filter, setFilter] = useState("all");

  const { todayItems } = t;
  const completed = todayItems.filter((i) => i.completed).length;

  const focusItems = [...todayItems]
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    .filter((i) => !i.completed)
    .slice(0, 3);

  const filtered =
    filter === "all" ? todayItems : todayItems.filter((i) => i.category === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight capitalize">
            {t.todayWeekday}
          </h1>
          <p className="text-muted-foreground mt-1">Your plan for today</p>
        </div>
        <StreakBadge streak={t.streak} />
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
