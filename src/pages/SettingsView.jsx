import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/hooks/useTheme";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Moon, Sun, Monitor, Plus, Trash2, GripVertical, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRESET_COLORS = [
  "#6366f1", "#3b82f6", "#06b6d4", "#14b8a6",
  "#22c55e", "#84cc16", "#f59e0b", "#f97316",
  "#ef4444", "#ec4899", "#a855f7", "#8b5cf6",
];

export default function SettingsView() {
  const { userProfile, updateUserSettings, categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useAppStore();
  const { theme, setTheme } = useTheme();
  const settings = userProfile?.settings || {};

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newIcon, setNewIcon] = useState("📁");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("Category already exists");
      return;
    }
    addCategory(trimmed, newColor, newIcon);
    setNewName("");
    setNewIcon("📁");
    setError("");
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    reorderCategories(items);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <p className="text-muted-foreground mt-1 mb-6">
        Preferences that apply across all devices.
      </p>

      {/* ── Appearance ── */}
      <section className="rounded-2xl border bg-card p-5 mb-6">
        <label className="block font-medium">Appearance</label>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Choose your preferred colour scheme. "System" follows your device setting.
        </p>
        <div className="flex gap-2">
          {[
            { value: "light", label: "Light", Icon: Sun },
            { value: "dark",  label: "Dark",  Icon: Moon },
            { value: "system", label: "System", Icon: Monitor },
          ].map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-colors ${
                theme === value
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Calendar System ── */}
      <section className="rounded-2xl border bg-card p-5 mb-6">
        <label className="block font-medium">Calendar system</label>
        <p className="text-sm text-muted-foreground mt-1">
          Changes dates for display only; event data stays synchronized in UTC.
        </p>
        <select
          value={settings.calendarSystem || "jalali"}
          onChange={(e) => updateUserSettings({ calendarSystem: e.target.value })}
          className="mt-4 w-full rounded-lg border bg-transparent p-2"
        >
          <option value="jalali">Persian (Jalali)</option>
          <option value="gregorian">Gregorian</option>
        </select>
      </section>

      {/* ── Custom Categories ── */}
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Custom Categories</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Create custom categories to organize your tasks. They sync across all your devices.
        </p>

        {/* Add form */}
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            className="w-10 h-10 text-center text-lg border rounded-md bg-transparent flex-shrink-0"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            maxLength={2}
            title="Category icon (emoji)"
          />
          <input
            type="text"
            placeholder="New Category..."
            className="flex-1 h-10 px-3 border rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <input
            type="color"
            className="w-10 h-10 rounded-md cursor-pointer border-0 p-1 flex-shrink-0"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            title="Category color"
          />
          <Button size="icon" onClick={handleAdd} title="Add category">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Color presets */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setNewColor(c)}
              className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: newColor === c ? "var(--foreground)" : "transparent",
                transform: newColor === c ? "scale(1.15)" : undefined,
              }}
              title={c}
            />
          ))}
        </div>

        {error && <p className="text-xs text-destructive mb-3">{error}</p>}

        {/* Category list */}
        {categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            No custom categories yet. Add one above!
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="settings-categories">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {categories.map((cat, index) => (
                    <Draggable key={cat.id} draggableId={cat.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-lg border group hover:border-primary/20 transition-colors"
                        >
                          <div {...provided.dragHandleProps} className="text-muted-foreground cursor-grab hover:text-foreground transition-colors">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            {cat.icon}
                          </div>
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm min-w-0"
                          />
                          <input
                            type="color"
                            value={cat.color || "#6366f1"}
                            onChange={(e) => updateCategory(cat.id, { color: e.target.value })}
                            className="w-7 h-7 rounded cursor-pointer border-0 p-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Change color"
                          />
                          <button
                            onClick={() => deleteCategory(cat.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete category"
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
        )}
      </section>
    </div>
  );
}
