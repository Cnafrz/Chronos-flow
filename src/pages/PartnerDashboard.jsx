import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useAppStore } from "@/store/useAppStore";
import { useTasks } from "@/hooks/useTasks";
import { PartnerService } from "@/services/PartnerService";
import { ProgressBar } from "@/components/ProgressBar";
import { Heart, Check, Copy, Unlink, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

import toast from "react-hot-toast";

const WEEKDAYS = [
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" }
];

export default function PartnerDashboard() {
  useTasks();
  const { user } = useAuth();
  const { partnerProfile, partnerTasks, userProfile } = useAppStore();
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [openDay, setOpenDay] = useState("saturday");

  const generateInvite = async () => {
    if (!user?.uid) {
      toast.error("You must be logged in to generate an invite code");
      return;
    }
    setLoading(true);
    try {
      const code = await PartnerService.generateInviteCode(user.uid);
      setInviteCode(code);
      toast.success("Invite code generated!");
    } catch (e) {
      console.error("Invite generation error:", e);
      toast.error("Failed to generate code: " + (e.message || "Unknown error"));
    }
    setLoading(false);
  };

  const acceptInvite = async () => {
    if (!user?.uid || !inputCode) return;
    setLoading(true);
    try {
      await PartnerService.acceptInvite(user.uid, inputCode.trim());
      setInputCode("");
      toast.success("Successfully linked partner!");
    } catch (e) {
      console.error("Accept invite error:", e);
      toast.error(e.message || "Invalid or expired code");
    }
    setLoading(false);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success("Code copied to clipboard!");
    } catch {
      // Fallback for environments where clipboard API isn't available
      toast.error("Could not copy — please copy manually");
    }
  };

  const isLinked = Boolean(userProfile?.partner_id);

  if (!isLinked) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center">
        <Heart className="w-12 h-12 mx-auto text-pink-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Partner Mode</h2>
        <p className="text-muted-foreground mb-8">Link accounts with an accountability partner to share progress and stay motivated together.</p>
        
        <div className="bg-card p-6 rounded-2xl border mb-6">
          <h3 className="font-semibold mb-4">Generate Invite Code</h3>
          {inviteCode ? (
            <div className="flex items-center gap-2 bg-muted p-3 rounded-lg font-mono text-xl justify-center tracking-widest">
              {inviteCode}
              <button onClick={copyCode} className="text-muted-foreground hover:text-foreground ml-2">
                <Copy className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Button onClick={generateInvite} disabled={loading} className="w-full">
              {loading ? "Generating..." : "Generate Code"}
            </Button>
          )}
        </div>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm">OR</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <div className="bg-card p-6 rounded-2xl border mt-2">
          <h3 className="font-semibold mb-4">Enter Partner's Code</h3>
          <div className="flex gap-2">
            <input 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="6-DIGIT CODE"
              className="flex-1 bg-transparent border rounded-md px-3 font-mono text-center tracking-widest"
              maxLength={6}
            />
            <Button onClick={acceptInvite} disabled={loading || inputCode.length < 6}>
              Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Partner is linked
  const todayDate = new Date().toDateString();
  const todaysTasks = partnerTasks.filter((task) => task.date === todayDate);
  const completedCount = todaysTasks.filter(t => t.completed).length;
  const focusTasks = todaysTasks.filter(t => t.is_focus && !t.completed).slice(0, 3);
  const completedToday = todaysTasks.filter(t => t.completed);
  const weeklyTasksByDay = WEEKDAYS.reduce((days, day) => {
    days[day.key] = partnerTasks
      .filter((task) => task.type === "weekly_recurring" && task.day_of_week === day.key)
      .sort((first, second) => (first.order || 0) - (second.order || 0));
    return days;
  }, {});

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect from your partner? Both of your data will remain intact, but you won't see each other's progress anymore.")) return;
    try {
      await PartnerService.disconnectPartner(user.uid, userProfile?.partner_id);
      toast.success("Partner disconnected safely");
      window.location.reload();
    } catch (e) {
      toast.error("Failed to disconnect");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Partner Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              {partnerProfile ? `Last online ${formatLastActive(partnerProfile.last_active_at)}` : "Connecting to partner..."}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-destructive hover:bg-destructive/10">
          <Unlink className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Partner's Progress Today</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {completedCount} / {todaysTasks.length} done
          </span>
        </div>
        <ProgressBar completed={completedCount} total={todaysTasks.length} />
      </div>

      <section className="mb-8">
        <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider mb-3">Their Checklist Today</h3>
        {todaysTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            No tasks on their checklist today
          </div>
        ) : (
          <div className="space-y-2">
            {todaysTasks.map((task) => (
              <div key={task.id} className={`flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 ${task.completed ? "opacity-60" : ""}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${task.completed ? "border-green-500 bg-green-500" : "border-border"}`}>
                  {task.completed && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </span>
                <span className={`flex-1 text-sm ${task.completed ? "line-through text-muted-foreground" : "font-medium"}`}>{task.title}</span>
                {task.startTime && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{task.startTime}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider mb-3">Their Focus</h3>
          {focusTasks.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-xl text-center">No focus items set</div>
          ) : (
            <div className="space-y-2">
              {focusTasks.map(t => (
                <div key={t.id} className="p-3 bg-card border rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                  <span className="text-sm font-medium">{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider mb-3">Activity Feed</h3>
          {completedToday.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-xl text-center">No tasks completed yet</div>
          ) : (
            <div className="space-y-3">
              {completedToday.map(t => (
                <div key={t.id} className="flex items-start gap-3">
                  <div className="mt-0.5 text-green-500"><Check className="w-4 h-4" /></div>
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">Partner</span> completed <span className="font-medium text-muted-foreground">{t.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="mt-8">
        <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider mb-3">Their Weekly Schedule</h3>
        <div className="space-y-2">
          {WEEKDAYS.map((day) => {
            const tasks = weeklyTasksByDay[day.key];
            const isOpen = openDay === day.key;
            return (
              <div key={day.key} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenDay(isOpen ? null : day.key)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-sm">{day.label} <span className="text-muted-foreground font-normal">({tasks.length})</span></span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-3 space-y-2">
                    {tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No scheduled tasks</p>
                    ) : tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                        <span className="font-medium">{task.title}</span>
                        {task.startTime && <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap"><Clock className="w-3 h-3" />{task.startTime}–{task.endTime}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function formatLastActive(timestamp) {
  if (!timestamp?.toDate) return "recently";

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp.toDate().getTime()) / 60000));
  if (elapsedMinutes < 2) return "now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  return `${Math.floor(elapsedHours / 24)}d ago`;
}
