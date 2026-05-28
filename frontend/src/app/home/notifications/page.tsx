"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
import { CalendarDays, FileText } from "lucide-react";

type MatchItem = {
  id: number;
  proposal_id: number;
  freelancer_user_id: number;
  status: string;
  proposal?: { title?: string };
  freelancer?: { first_name?: string; last_name?: string; email?: string };
};

type MeetingItem = { id: number; status: string; scheduled_at?: string };
type ContractItem = { id: number; status: string; title?: string };

const STATUS_STYLE: Record<string, string> = {
  company_approved:    "bg-blue-50 text-blue-700",
  freelancer_approved: "bg-amber-50 text-amber-700",
  mutual_approved:     "bg-emerald-50 text-emerald-700",
  rejected:            "bg-red-50 text-red-600",
  approved:            "bg-emerald-50 text-emerald-700",
  draft:               "bg-gray-100 text-gray-500",
  active:              "bg-emerald-50 text-emerald-700",
  completed:           "bg-blue-50 text-blue-700",
  cancelled:           "bg-red-50 text-red-600",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLE[status] || "bg-gray-100 text-gray-500"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function freelancerName(m: MatchItem): string {
  const f = m.freelancer;
  if (!f) return `Freelancer #${m.freelancer_user_id}`;
  return `${f.first_name || ""} ${f.last_name || ""}`.trim() || f.email || `#${m.freelancer_user_id}`;
}

export default function HomeNotificationsPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userId = Number(localStorage.getItem("userId") || 0);
      const [mx, mt, ct] = await Promise.all([
        api.get("/matches",   { params: { actor_user_id: userId } }).catch(() => ({ data: [] })),
        api.get("/meetings",  { params: { actor_user_id: userId } }).catch(() => ({ data: [] })),
        api.get("/contracts", { params: { actor_user_id: userId } }).catch(() => ({ data: [] })),
      ]);
      setMatches((mx.data || []).filter((x: MatchItem) => x.status !== "pending"));
      setMeetings(mt.data || []);
      setContracts(ct.data || []);
      setLoading(false);
    };
    load();
  }, []);

  // Group matches by proposal
  const proposalGroups = matches.reduce<Record<string, { title: string; items: MatchItem[] }>>((acc, m) => {
    const key = String(m.proposal_id);
    if (!acc[key]) acc[key] = { title: m.proposal?.title || `Proposal #${m.proposal_id}`, items: [] };
    acc[key].items.push(m);
    return acc;
  }, {});

  const hasAnything = matches.length > 0 || meetings.length > 0 || contracts.length > 0;

  return (
    <SectionShell
      title="Notifications"
      description="Track workflow updates for matches, meetings, and contracts."
    >
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">Loading…</div>
      ) : !hasAnything ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500 text-sm">No notifications yet.</div>
      ) : (
        <div className="space-y-6">

          {/* ── Matches grouped by proposal ── */}
          {matches.length > 0 && (
            <div className="space-y-4">
              {Object.values(proposalGroups).map((group) => (
                <div key={group.title} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  {/* Proposal header */}
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">{group.title}</p>
                  </div>
                  {/* Freelancer rows */}
                  <ul className="divide-y divide-gray-100">
                    {group.items.map((m) => (
                      <li key={m.id} className="flex items-center justify-between px-5 py-3 gap-4">
                        <span className="text-sm text-gray-700">{freelancerName(m)}</span>
                        <StatusBadge status={m.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* ── Meetings ── */}
          {meetings.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
                <CalendarDays className="w-4 h-4 text-red-600" />
                <p className="text-sm font-semibold text-gray-800">Meetings</p>
              </div>
              <ul className="divide-y divide-gray-100">
                {meetings.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-5 py-3 gap-4">
                    <span className="text-sm text-gray-700">
                      {m.scheduled_at
                        ? `Scheduled on ${new Date(m.scheduled_at).toLocaleDateString()}`
                        : `Meeting #${m.id}`}
                    </span>
                    <StatusBadge status={m.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Contracts ── */}
          {contracts.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
                <FileText className="w-4 h-4 text-red-600" />
                <p className="text-sm font-semibold text-gray-800">Contracts</p>
              </div>
              <ul className="divide-y divide-gray-100">
                {contracts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-5 py-3 gap-4">
                    <span className="text-sm text-gray-700">{c.title || `Contract #${c.id}`}</span>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </SectionShell>
  );
}
