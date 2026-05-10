"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";

export default function HomeNotificationsPage() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const userId = Number(localStorage.getItem("userId") || 0);

      const [meetings, contracts, matches] = await Promise.all([
        api.get("/meetings", {
          params: { actor_user_id: userId },
        }),
        api.get("/contracts", {
          params: { actor_user_id: userId },
        }),
        api.get("/matches", {
          params: { actor_user_id: userId },
        }),
      ]);

      const notes: string[] = [];
      for (const m of meetings.data || [])
        notes.push(`Meeting #${m.id} is ${m.status}`);
      for (const c of contracts.data || [])
        notes.push(`Contract #${c.id} is ${c.status}`);
      for (const m of matches.data || [])
        notes.push(`Match #${m.id} is ${m.status}`);

      setItems(notes);
    };

    load();
  }, []);

  return (
    <SectionShell
      title="Notifications"
      description="Track workflow updates for matches, meetings, contracts, and outcomes."
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
            >
              {item}
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-gray-600">No notifications yet.</li>
          )}
        </ul>
      </div>
    </SectionShell>
  );
}
