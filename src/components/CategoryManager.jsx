import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical, Settings2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";

export default function CategoryManager() {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useAppStore();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1"); // default indigo
  const [newIcon, setNewIcon] = useState("📁");

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCategory(newName.trim(), newColor, newIcon);
    setNewName("");
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    reorderCategories(items);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="ml-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Manage Categories"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center gap-2 mb-4">
          <input 
            type="text" 
            className="w-10 h-10 text-center text-lg border rounded-md bg-transparent"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            maxLength={2}
          />
          <input 
            type="text" 
            placeholder="New Category..."
            className="flex-1 h-10 px-3 border rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <input 
            type="color"
            className="w-10 h-10 rounded-md cursor-pointer border-0 p-1"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
          />
          <Button size="icon" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {categories.map((cat, index) => (
                  <Draggable key={cat.id} draggableId={cat.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg border group"
                      >
                        <div {...provided.dragHandleProps} className="text-muted-foreground cursor-grab">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          {cat.icon}
                        </div>
                        <input 
                          type="text" 
                          value={cat.name}
                          onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                          className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                        />
                        <button 
                          onClick={() => deleteCategory(cat.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </DialogContent>
    </Dialog>
  );
}
