"use client";

import { useEffect, useRef } from "react";

interface Reminder {
  id: string;
  title: string;
  dueAt: string;
  priority: string;
}

export function useReminderNotifications(reminders: Reminder[]) {
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      try {
        Notification.requestPermission();
      } catch {
        // WebView / restricted context — permission API not available
      }
    }
  }, []);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted" || reminders.length === 0) return;

    const intervalMs = 60000;

    const check = () => {
      reminders.forEach((r) => {
        if (notifiedIds.current.has(r.id)) return;
        const dueAt = new Date(r.dueAt).getTime();
        const diff = dueAt - Date.now();

        if (diff < 3600000) {
          try {
            const n = new Notification(r.title, {
              body: diff < 0 ? "This reminder is overdue!" : `Due ${Math.ceil(diff / 60000)} minutes from now.`,
              tag: r.id,
            });
            n.onclick = () => {
              window.focus();
              window.location.href = "/reminders";
            };
          } catch {
            // WebView / restricted context — Notification constructor not available
          }
          notifiedIds.current.add(r.id);
        }
      });
    };

    check();
    const interval = setInterval(check, intervalMs);
    return () => clearInterval(interval);
  }, [reminders]);
}

export function getActiveCount(reminders: Reminder[]): number {
  const now = Date.now();
  return reminders.filter((r) => {
    const dueAt = new Date(r.dueAt).getTime();
    return dueAt <= now + 86400000; // due within next 24 hours or overdue
  }).length;
}
