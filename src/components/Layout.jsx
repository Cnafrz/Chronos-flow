import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { BarChart3, CalendarDays, CalendarRange, Heart, Home, LogOut, Menu, Moon, NotebookPen, Settings, Sun, Target } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { formatCalendarDate, calendarSystem } from "@/lib/calendar";
import { useAppStore } from "@/store/useAppStore";
import AnimatedBackground from "@/components/AnimatedBackground";
import NotificationPermissionBanner from "@/components/NotificationPermissionBanner";

const primary = [["/", "Home", Home], ["/calendar", "Calendar", CalendarDays], ["/goals", "Goals", Target]];
const more = [["/weekly", "Weekly", CalendarRange], ["/notes", "Notes", NotebookPen], ["/partner", "Partner", Heart], ["/analytics", "Analytics", BarChart3], ["/settings", "Settings", Settings]];

function Item({ item, mobile = false, onNavigate }) {
  const [to, label, Icon] = item;
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"} ${mobile ? "flex-col gap-1 px-2 py-1 text-[10px]" : ""}`
      }
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const { userProfile } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  // Electron deep-link: main process sends "navigate" IPC after notification click
  useEffect(() => {
    const handler = (_event, route) => { if (route) navigate(route); };
    if (window.electronApp) {
      // Listen via ipcRenderer if available (set up in preload)
      // Since contextBridge doesn't expose ipcRenderer directly, we use a custom event
      // that the preload can emit via window.dispatchEvent
      window.addEventListener("electron-navigate", (e) => navigate(e.detail));
    }
    return () => window.removeEventListener("electron-navigate", handler);
  }, [navigate]);

  const signOut = () => { if (window.confirm("Log out of ChronosFlow?")) logout(); };
  const date = formatCalendarDate(new Date(), calendarSystem(userProfile?.settings));

  // Single handler that closes the More sheet then lets navigation proceed normally
  const closeSheet = () => setMoreOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatedBackground />

      {/* ── Desktop Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-card/90 backdrop-blur lg:flex lg:flex-col"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "1rem", paddingBottom: "1rem" }}>
        <div className="mb-8 text-xl font-bold">ChronosFlow</div>
        <nav className="space-y-1">
          {primary.map((item) => <Item key={item[1]} item={item} />)}
          <p className="px-3 pt-5 pb-2 text-xs font-semibold text-muted-foreground">MORE</p>
          {more.map((item) => <Item key={item[1]} item={item} />)}
        </nav>
        <div className="mt-auto space-y-1">
          <button onClick={toggle} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : theme === "light" ? <Moon className="w-4 h-4" /> : <span className="w-4 h-4 text-[10px] font-bold flex items-center justify-center">A</span>}
            {theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System"}
          </button>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-5xl pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] lg:ml-60 lg:max-w-none lg:px-10 lg:py-10"
        style={{ paddingLeft: "calc(1rem + env(safe-area-inset-left))", paddingRight: "calc(1rem + env(safe-area-inset-right))" }}>
        <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">{date}</p>
        <NotificationPermissionBanner />
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t bg-card/95 backdrop-blur lg:hidden"
        style={{
          paddingTop: "0.5rem",
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
          paddingRight: "max(0.5rem, env(safe-area-inset-right))",
        }}
      >
        {primary.map((item) => <Item key={item[1]} item={item} mobile />)}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className="flex flex-col items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground"
        >
          <Menu className="w-4 h-4" />
          More
        </button>
      </nav>

      {/* ── More Sheet: backdrop + panel ── */}
      {moreOpen && (
        <>
          {/* Backdrop — tap outside to close */}
          <div
            className="fixed inset-0 z-39 lg:hidden"
            onClick={closeSheet}
            aria-hidden="true"
          />
          <div className="fixed inset-x-3 bottom-20 z-40 rounded-2xl border bg-card p-2 shadow-xl lg:hidden">
            <div className="grid grid-cols-2">
              {more.map((item) => (
                <Item key={item[1]} item={item} onNavigate={closeSheet} />
              ))}
            </div>
            <button
              onClick={() => { closeSheet(); signOut(); }}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
