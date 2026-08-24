import { motion } from "framer-motion";
import { Check, Target, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useAppStore } from "@/store/useAppStore";

export default function TodayFocus({ items, onToggle }) {
  const reorderToday = useAppStore(s => s.reorderToday);

  if (items.length === 0) return null;

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const next = [...items];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    reorderToday(next);
  };

  return (
    <section className="mb-6">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
        <Target className="w-3.5 h-3.5" /> Today's Focus
      </h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="focus" direction="horizontal">
          {(provided) => (
            <div 
              ref={provided.innerRef} 
              {...provided.droppableProps}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(prov, snapshot) => (
                    <motion.div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`text-left rounded-xl border bg-card p-3 transition-colors group flex flex-col gap-1.5 ${
                        snapshot.isDragging ? "border-indigo-500 shadow-lg z-50" : "border-border hover:border-indigo-400"
                      }`}
                      style={{ ...prov.draggableProps.style }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <div 
                            {...prov.dragHandleProps} 
                            className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-medium text-indigo-500">#{index + 1}</span>
                        </div>
                        <button 
                          onClick={() => onToggle(item.id)}
                          className="w-4 h-4 rounded border-2 border-border group-hover:border-indigo-400 flex items-center justify-center cursor-pointer"
                        >
                          <Check className="w-2.5 h-2.5 text-transparent" />
                        </button>
                      </div>
                      <p className="text-sm font-medium mt-1 leading-snug line-clamp-2">{item.title}</p>
                    </motion.div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </section>
  );
}