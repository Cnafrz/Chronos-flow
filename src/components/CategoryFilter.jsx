import { CATEGORIES } from "@/lib/categories";

export default function CategoryFilter({ selected, onChange, categories = [] }) {
  const options = [
    { key: "all", label: "All", dot: "bg-foreground/40" },
    ...CATEGORIES,
    ...categories.map((category) => ({ key: category.id, label: category.name, emoji: category.icon }))
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((c) => {
        const active = selected === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
              active
                ? "border-foreground/20 bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {"emoji" in c && <span>{c.emoji}</span>}
            <span className={c.key === "all" ? "" : "hidden sm:inline"}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
