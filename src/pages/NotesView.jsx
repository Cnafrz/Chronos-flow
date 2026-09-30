import { useMemo, useState } from "react";
import { Plus, Search, Pin, Trash2, StickyNote } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function NotesView() {
  const { notebooks, notes, addNotebook, saveNote, deleteNote } = useAppStore();
  const [selectedNotebook, setSelectedNotebook] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  
  const filtered = useMemo(() => notes
    .filter((note) => (!selectedNotebook || note.notebookId === selectedNotebook) && `${note.title} ${note.body}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned)), [notes, selectedNotebook, query]);
  
  const newNote = () => setEditing({ notebookId: selectedNotebook || notebooks[0]?.id || "", title: "Untitled note", body: "", pinned: false });
  
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Workspace</h1>
          <p className="text-muted-foreground mt-1">Keep notebooks, notes, and ideas together.</p>
        </div>
        <button onClick={newNote} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium">
          <Plus className="w-4 h-4" /> New note
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border bg-card p-4 h-max">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">Notebooks</h3>
          <div className="space-y-1">
            <button onClick={() => setSelectedNotebook("")} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${!selectedNotebook ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-medium" : "hover:bg-muted/50"}`}>
              All notes
            </button>
            {notebooks.map((book) => (
              <button key={book.id} onClick={() => setSelectedNotebook(book.id)} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${selectedNotebook === book.id ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-medium" : "hover:bg-muted/50"}`}>
                {book.name}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t px-2">
            <button onClick={() => { const name = prompt("Notebook name"); if (name) addNotebook(name); }} className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New notebook
            </button>
          </div>
        </aside>

        <section>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes..." className="w-full border border-border rounded-xl bg-card py-2.5 pl-10 pr-4 outline-none focus:border-indigo-400 transition-colors" />
          </div>
          
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                <StickyNote className="w-8 h-8 text-indigo-500/50" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No notes found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">You don't have any notes here yet. Create your first note to capture ideas.</p>
              <button onClick={newNote} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
                <Plus className="w-4 h-4" /> Create note
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((note) => (
                <button key={note.id} onClick={() => setEditing(note)} className="text-left rounded-xl border border-border bg-card p-5 hover:border-indigo-400 transition-all hover:shadow-md flex flex-col h-full">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <p className="font-semibold text-foreground leading-snug">{note.title}</p>
                    {note.pinned && <Pin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1 whitespace-pre-wrap">{note.body || "No content"}</p>
                  <p className="text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">Updated {note.updatedAt?.toDate?.().toLocaleDateString() || "just now"}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 overflow-y-auto backdrop-blur-sm flex items-start justify-center">
          <div className="w-full max-w-2xl mt-12 mb-12 bg-card rounded-2xl border shadow-xl flex flex-col">
            <div className="p-6 border-b flex items-center gap-4">
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="flex-1 text-2xl font-bold bg-transparent outline-none placeholder:text-muted-foreground" placeholder="Note Title" />
              <button type="button" onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-4">
              <div className="flex gap-4 items-center">
                <label className="text-sm text-muted-foreground">Notebook:</label>
                <select value={editing.notebookId} onChange={(e) => setEditing({ ...editing, notebookId: e.target.value })} className="border rounded-md px-3 py-1.5 bg-background text-sm">
                  {notebooks.map((book) => <option key={book.id} value={book.id}>{book.name}</option>)}
                </select>
              </div>
              <textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} className="flex-1 min-h-[300px] w-full bg-transparent outline-none resize-y placeholder:text-muted-foreground/50 leading-relaxed" placeholder="Start typing here..." />
            </div>
            <div className="p-4 border-t flex justify-between items-center bg-muted/20 rounded-b-2xl">
              <button onClick={() => setEditing({ ...editing, pinned: !editing.pinned })} className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md transition-colors ${editing.pinned ? "text-indigo-500 bg-indigo-500/10" : "text-muted-foreground hover:bg-muted"}`}>
                <Pin className="w-4 h-4" /> {editing.pinned ? "Pinned" : "Pin"}
              </button>
              <div className="flex gap-2">
                {editing.id && (
                  <button onClick={() => { deleteNote(editing.id); setEditing(null); }} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => { saveNote(editing); setEditing(null); }} className="rounded-lg bg-primary text-primary-foreground px-6 py-2 text-sm font-medium shadow-sm hover:opacity-90">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
