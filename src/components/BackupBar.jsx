import { useRef } from "react";
import { Download, Upload } from "lucide-react";

export default function BackupBar({ data, onImport }) {
  const fileRef = useRef(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `productivity-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        onImport(parsed);
      } catch {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
      >
        <Download className="w-3.5 h-3.5" /> Export
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
      >
        <Upload className="w-3.5 h-3.5" /> Import
      </button>
      <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
    </div>
  );
}