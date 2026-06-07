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

type MeetingItem = {
  id: number;
  status: string;
  proposed_at?: string;
  notes?: string;
  company?: { company_name?: string; contact_first_name?: string };
  freelancer?: { first_name?: string; last_name?: string; email?: string };
};
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

const FREELANCER_STATUS_LABEL: Record<string, string> = {
  company_approved: "Company approved your application — accept or decline",
  mutual_approved:  "Mutual match — you're hired! ✓",
  rejected:         "Application rejected",
};

const COMPANY_STATUS_LABEL: Record<string, string> = {
  freelancer_approved: "Freelancer accepted your offer — awaiting your approval",
  mutual_approved:     "Mutual match — hire confirmed ✓",
  rejected:            "Freelancer declined",
};

const STATUS_LABEL: Record<string, string> = {
  mutual_approved:     "Both approved ✓",
  company_approved:    "Company approved",
  freelancer_approved: "Freelancer approved",
  approved:            "Approved ✓",
  rejected:            "Rejected",
  draft:               "Draft",
  active:              "Active",
  completed:           "Completed",
  cancelled:           "Cancelled",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLE[status] || "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABEL[status] || status.replace(/_/g, " ")}
    </span>
  );
}

function freelancerName(m: MatchItem): string {
  const f = m.freelancer;
  if (!f) return `Freelancer #${m.freelancer_user_id}`;
  return `${f.first_name || ""} ${f.last_name || ""}`.trim() || f.email || `#${m.freelancer_user_id}`;
}

export default function HomeNotificationsPage() {
  const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Statuses that represent the OTHER party's action — only those are worth notifying about
  const relevantStatuses = role === "freelancer"
    ? ["company_approved", "mutual_approved", "rejected"]
    : ["freelancer_approved", "mutual_approved", "rejected"];

  useEffect(() => {
    const load = async () => {
      const userId = Number(localStorage.getItem("userId") || 0);
      const [mx, mt, ct] = await Promise.all([
        api.get("/matches",   { params: { actor_user_id: userId } }).catch(() => ({ data: [] })),
        api.get("/meetings",  { params: { actor_user_id: userId } }).catch(() => ({ data: [] })),
        api.get("/contracts", { params: { actor_user_id: userId } }).catch(() => ({ data: [] })),
      ]);
      setMatches((mx.data || []).filter((x: MatchItem) => relevantStatuses.includes(x.status)));
      setMeetings(mt.data || []);
      setContracts(ct.data || []);
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group matches by proposal
  const proposalGroups = matches.reduce<Record<string, { title: string; items: MatchItem[] }>>((acc, m) => {
    const key = String(m.proposal_id);
    if (!acc[key]) acc[key] = { title: m.proposal?.title || `Proposal #${m.proposal_id}`, items: [] };
    acc[key].items.push(m);
    return acc;
  }, {});

  const hasAnything = matches.length > 0 || meetings.length > 0 || contracts.length > 0;

  const matchLabel = (status: string) =>
    role === "freelancer"
      ? FREELANCER_STATUS_LABEL[status] || status.replace(/_/g, " ")
      : COMPANY_STATUS_LABEL[status] || status.replace(/_/g, " ");

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
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">{group.title}</p>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {group.items.map((m) => (
                      <li key={m.id} className="flex items-center justify-between px-5 py-3 gap-4">
                        {role === "company" && (
                          <span className="text-sm text-gray-700">{freelancerName(m)}</span>
                        )}
                        <span className={`text-sm ${role === "freelancer" ? "text-gray-700" : "text-gray-500 text-xs"}`}>
                          {matchLabel(m.status)}
                        </span>
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
                  <li key={m.id} className="flex items-start justify-between px-5 py-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {m.company?.company_name || m.company?.contact_first_name
                          ? `Meeting with ${m.company.company_name || m.company.contact_first_name}`
                          : m.freelancer?.first_name
                          ? `Meeting with ${m.freelancer.first_name} ${m.freelancer.last_name || ""}`.trim()
                          : `Meeting #${m.id}`}
                      </p>
                      {m.proposed_at && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(m.proposed_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      )}
                      {m.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">{m.notes}</p>
                      )}
                    </div>
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
