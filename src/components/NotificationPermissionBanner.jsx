import { useState, useEffect } from "react";
import { BellOff, X } from "lucide-react";
import { isPermissionDenied } from "@/services/NotificationService";

/**
 * Shows a dismissible banner when the user has explicitly denied notification
 * permissions, with guidance on how to re-enable them in the browser/OS settings.
 */
export default function NotificationPermissionBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show once per session and only if denied
    const sessionDismissed = sessionStorage.getItem("notif-banner-dismissed");
    if (!sessionDismissed && isPermissionDenied()) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("notif-banner-dismissed", "1");
    setDismissed(true);
    setShow(false);
  };

  if (!show || dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700/50 px-4 py-3 mb-4 text-sm">
      <BellOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-amber-800 dark:text-amber-300">Notifications are blocked</p>
        <p className="text-amber-700 dark:text-amber-400 mt-0.5">
          To receive task reminders, re-enable notifications in your browser settings:
          click the lock/info icon in the address bar → Notifications → Allow.
        </p>
      </div>
      <button onClick={dismiss} className="text-amber-600 dark:text-amber-400 hover:text-amber-800 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
