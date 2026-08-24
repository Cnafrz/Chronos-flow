import { getCategory } from "@/lib/categories";
import { useAppStore } from "@/store/useAppStore";

export default function CategoryBadge({ category }) {
  const customCategory = useAppStore((state) => state.categories.find((item) => item.id === category));
  const builtIn = getCategory(category);

  if (builtIn) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md ${builtIn.cls}`}>
        <span>{builtIn.emoji}</span>
        <span className="hidden sm:inline">{builtIn.label}</span>
      </span>
    );
  }

  if (customCategory) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md"
        style={{
          backgroundColor: `${customCategory.color}20`,
          color: customCategory.color,
        }}
      >
        <span>{customCategory.icon}</span>
        <span className="hidden sm:inline">{customCategory.name}</span>
      </span>
    );
  }

  return null;
}
