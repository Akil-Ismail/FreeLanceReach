"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

export type NotificationCounts = {
  approvals: number;
  meetings: number;
  notifications: number;
};

export type LiveNotification = {
  id: number;
  message: string;
};

const SEEN_KEY = (userId: number) => `notif_seen:${userId}`;

function getSeenCounts(userId: number): NotificationCounts {
  try {
    const raw = localStorage.getItem(SEEN_KEY(userId));
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return { approvals: 0, meetings: 0, notifications: 0 };
}

function saveSeenCounts(userId: number, counts: NotificationCounts) {
  localStorage.setItem(SEEN_KEY(userId), JSON.stringify(counts));
}

export function useNotificationCounts(
  userId: number,
  role: string | null,
  onLiveNotification?: (n: LiveNotification) => void,
) {
  const [counts, setCounts] = useState<NotificationCounts>({ approvals: 0, meetings: 0, notifications: 0 });
  const prevRef = useRef<NotificationCounts>({ approvals: 0, meetings: 0, notifications: 0 });
  const rawPrevRef = useRef({ approvals: 0, meetings: 0 });
  const notifIdRef = useRef(0);

  useEffect(() => {
    if (!userId || !role) return;

    const fetchCounts = async () => {
      const [matchRes, meetingRes] = await Promise.all([
        api.get("/matches", { params: { actor_user_id: userId } }).catch(() => ({ data: [] })),
        api.get("/meetings", { params: { actor_user_id: userId } }).catch(() => ({ data: [] })),
      ]);

      const matches = matchRes.data || [];
      const meetings = meetingRes.data || [];

      const approvals = matches.filter((m: { status: string }) =>
        role === "freelancer" ? m.status === "company_approved" : m.status === "freelancer_approved"
      ).length;

      const pendingMeetings = meetings.filter((m: { status: string }) =>
        role === "freelancer" ? m.status === "pending_freelancer" : m.status === "pending_company"
      ).length;

      const seen = getSeenCounts(userId);
      const newCounts: NotificationCounts = {
        approvals: Math.max(0, approvals - seen.approvals),
        meetings: Math.max(0, pendingMeetings - seen.meetings),
        notifications: Math.max(0, (approvals + pendingMeetings) - (seen.approvals + seen.meetings)),
      };

      // Detect new items by comparing raw counts (not badge counts which are affected by seen offsets)
      const rawPrev = rawPrevRef.current;
      if (onLiveNotification) {
        if (pendingMeetings > rawPrev.meetings) {
          onLiveNotification({ id: ++notifIdRef.current, message: "You have a new meeting request" });
        } else if (approvals > rawPrev.approvals) {
          onLiveNotification({ id: ++notifIdRef.current, message: "A new match is awaiting your approval" });
        }
      }

      rawPrevRef.current = { approvals, meetings: pendingMeetings };
      prevRef.current = newCounts;
      setCounts(newCounts);
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [userId, role, onLiveNotification]);

  const markSeen = (section: keyof NotificationCounts | "all") => {
    const seen = getSeenCounts(userId);
    if (section === "approvals") seen.approvals += counts.approvals;
    else if (section === "meetings") seen.meetings += counts.meetings;
    else if (section === "all") {
      seen.approvals += counts.approvals;
      seen.meetings += counts.meetings;
    }
    seen.notifications = seen.approvals + seen.meetings;
    saveSeenCounts(userId, seen);
    setCounts((prev) => {
      const next = { ...prev };
      if (section === "approvals") { next.approvals = 0; next.notifications = Math.max(0, prev.notifications - prev.approvals); }
      else if (section === "meetings") { next.meetings = 0; next.notifications = Math.max(0, prev.notifications - prev.meetings); }
      else if (section === "all") { next.approvals = 0; next.meetings = 0; next.notifications = 0; }
      return next;
    });
  };

  return { counts, markSeen };
}
