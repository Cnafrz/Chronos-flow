import { CATEGORIES } from "@/lib/categories";
import CategoryBadge from "@/components/CategoryBadge";
import CategoryManager from "@/components/CategoryManager";

export default function TemplatePicker({ templates, todayItems, onToggle, onSelectAll }) {
  const inToday = (templateId) => todayItems.find((it) => it.templateId === templateId);
  const remaining = templates.filter((t) => !inToday(t.id)).length;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Add flexible tasks
          </h2>
          <CategoryManager />
        </div>
        <button
          onClick={() => {
            const unadded = templates.filter(t => !inToday(t.id));
            unadded.forEach(t => onToggle(t.id));
          }}
          disabled={remaining === 0}
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity disabled:opacity-30"
        >
          {remaining > 0 ? `Select all (${remaining})` : "All selected"}
        </button>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No templates yet. Add some on the Weekly page.
          </p>
        ) : (
          templates.map((tpl) => {
            const entry = inToday(tpl.id);
            const isChecked = !!entry;
            const isCompleted = entry?.completed;
            return (
              <label
                key={tpl.id}
                className={`flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 cursor-pointer hover:bg-muted/40 transition-colors ${
                  isCompleted ? "opacity-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isCompleted}
                  onChange={() => onToggle(tpl.id)}
                  className="w-4 h-4 rounded border-border accent-indigo-500"
                />
                <span className="flex-1 text-sm">{tpl.title}</span>
                <CategoryBadge category={tpl.category} />
                {isCompleted && (
                  <span className="text-[11px] text-muted-foreground">completed</span>
                )}
              </label>
            );
          })
        )}
      </div>
    </section>
  );
}