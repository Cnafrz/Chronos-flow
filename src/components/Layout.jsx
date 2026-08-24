import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { BarChart3, CalendarDays, CalendarRange, Heart, Home, LogOut, Menu, Moon, NotebookPen, Settings, Sun, Target } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { formatCalendarDate, calendarSystem } from "@/lib/calendar";
import { useAppStore } from "@/store/useAppStore";
import AnimatedBackground from "@/components/AnimatedBackground";

const primary = [["/", "Home", Home], ["/calendar", "Calendar", CalendarDays], ["/goals", "Goals", Target]];
const more = [["/weekly", "Weekly", CalendarRange], ["/notes", "Notes", NotebookPen], ["/partner", "Partner", Heart], ["/analytics", "Analytics", BarChart3], ["/settings", "Settings", Settings]];

function Item({ item, mobile = false }) { const [to, label, Icon] = item; return <NavLink to={to} end={to === "/"} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"} ${mobile ? "flex-col gap-1 px-2 py-1 text-[10px]" : ""}`}><Icon className="w-4 h-4" /><span>{label}</span></NavLink>; }

export default function Layout() {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const { userProfile } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const signOut = () => { if (window.confirm("Log out of ChronosFlow?")) logout(); };
  const date = formatCalendarDate(new Date(), calendarSystem(userProfile?.settings));
  return <div className="min-h-screen bg-background text-foreground"><AnimatedBackground /><aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-card/90 p-4 backdrop-blur lg:flex lg:flex-col"><div className="mb-8 text-xl font-bold">ChronosFlow</div><nav className="space-y-1">{primary.map((item) => <Item key={item[1]} item={item} />)}<p className="px-3 pt-5 pb-2 text-xs font-semibold text-muted-foreground">MORE</p>{more.map((item) => <Item key={item[1]} item={item} />)}</nav><div className="mt-auto space-y-1"><button onClick={toggle} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted">{theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}Theme</button><button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10"><LogOut className="w-4 h-4" />Log out</button></div></aside><main className="mx-auto max-w-5xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] lg:ml-60 lg:max-w-none lg:px-10 lg:py-10"><p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">{date}</p><Outlet /></main><nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t bg-card/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">{primary.map((item) => <Item key={item[1]} item={item} mobile />)}<button onClick={() => setMoreOpen(!moreOpen)} className="flex flex-col items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground"><Menu className="w-4 h-4" />More</button></nav>{moreOpen && <div className="fixed inset-x-3 bottom-20 z-40 rounded-2xl border bg-card p-2 shadow-xl lg:hidden"><div className="grid grid-cols-2">{more.map((item) => <Item key={item[1]} item={item} />)}</div><button onClick={signOut} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive"><LogOut className="w-4 h-4" />Log out</button></div>}</div>;
}
