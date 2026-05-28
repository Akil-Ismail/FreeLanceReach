"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  User,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import SearchBar from "@/components/protected/SearchBar";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";

type Match = {
  id: number;
  proposal_id: number;
  freelancer_user_id: number;
  match_score: number;
  status: string;
  model_source: string;
  proposal?: { title?: string; status?: string };
  freelancer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    freelance_category?: string;
    cv_path?: string | null;
  };
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  company_approved: "bg-blue-50 text-blue-700",
  freelancer_approved: "bg-amber-50 text-amber-700",
  mutual_approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

export default function HomeMatchingPage() {
  const router = useRouter();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const userId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("userId") || 0)
      : 0;

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const toggleGroup = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadMatches = useCallback(
    async (quiet = false) => {
      if (!userId) return;
      if (!quiet) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await api.get("/matches", {
          params: { actor_user_id: userId },
        });
        setMatches(res.data || []);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  const rerunAndRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      if (role === "company") {
        const proposalsRes = await api.get("/proposals", {
          params: { actor_user_id: userId },
        });
        await Promise.all(
          (proposalsRes.data || []).map((p: { id: number }) =>
            api
              .post(`/proposals/${p.id}/match`, { actor_user_id: userId })
              .catch(() => {}),
          ),
        );
      }
      const res = await api.get("/matches", {
        params: { actor_user_id: userId },
      });
      setMatches(res.data || []);
    } finally {
      setRefreshing(false);
    }
  }, [userId, role]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const respond = async (matchId: number, approve: boolean) => {
    setRespondingId(matchId);
    try {
      await api.post(`/matches/${matchId}/respond`, {
        actor_user_id: userId,
        approve,
      });
      showToast("success", approve ? "Match approved." : "Match rejected.");
      await loadMatches(true);
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        e.response?.data?.message || e.message || "Action failed.",
      );
    } finally {
      setRespondingId(null);
    }
  };

  const removeApproval = async (matchId: number) => {
    setRespondingId(matchId);
    try {
      await api.post(`/matches/${matchId}/respond`, {
        actor_user_id: userId,
        approve: true,
        remove_approval: true,
      });
      showToast("success", "Approval removed.");
      await loadMatches(true);
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        e.response?.data?.message || e.message || "Action failed.",
      );
    } finally {
      setRespondingId(null);
    }
  };

  const needsAction = (m: Match) => {
    if (role === "company")
      return m.status === "pending" || m.status === "freelancer_approved";
    if (role === "freelancer")
      return m.status === "pending" || m.status === "company_approved";
    return false;
  };

  const canRemoveApproval = (m: Match) => {
    if (role === "company")
      return m.status === "company_approved" || m.status === "mutual_approved";
    if (role === "freelancer")
      return (
        m.status === "freelancer_approved" || m.status === "mutual_approved"
      );
    return false;
  };

  const freelancerName = (m: Match) => {
    const f = m.freelancer;
    if (!f) return `Freelancer #${m.freelancer_user_id}`;
    return (
      `${f.first_name || ""} ${f.last_name || ""}`.trim() ||
      f.email ||
      `#${m.freelancer_user_id}`
    );
  };

  // Filter: above 20%, exclude rejected, apply search query
  const visible = matches
    .filter((m) => Math.round(Number(m.match_score) * 100) > 20)
    .filter((m) => m.status !== "rejected")
    .filter((m) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        freelancerName(m).toLowerCase().includes(q) ||
        (m.proposal?.title || "").toLowerCase().includes(q) ||
        (m.freelancer?.freelance_category || "").toLowerCase().includes(q)
      );
    });

  // Group by proposal
  const groups = visible.reduce<
    Record<string, { title: string; items: Match[] }>
  >((acc, m) => {
    const key = String(m.proposal_id);
    if (!acc[key])
      acc[key] = {
        title: m.proposal?.title || `Proposal #${m.proposal_id}`,
        items: [],
      };
    acc[key].items.push(m);
    return acc;
  }, {});

  // Sort each group: needs action first, then by score
  Object.values(groups).forEach((g) => {
    g.items.sort((a, b) => {
      const aAct = needsAction(a) ? 1 : 0;
      const bAct = needsAction(b) ? 1 : 0;
      if (bAct !== aAct) return bAct - aAct;
      return Number(b.match_score) - Number(a.match_score);
    });
  });

  const pendingCount = visible.filter((m) => needsAction(m)).length;

  return (
    <SectionShell
      title={`Matching${!loading ? ` (${pendingCount} need action)` : ""}`}
      description="AI scores and ranks freelancers for each proposal. Approve or reject candidates to move them forward."
      actions={
        <div className="flex items-center gap-2">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search freelancer or proposal…"
          />
          <button
            className="btn-secondary text-sm flex items-center gap-2 shrink-0"
            onClick={rerunAndRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      }
    >
      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${toast.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
        >
          {toast.text}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
          Loading matches…
        </div>
      ) : Object.keys(groups).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-sm text-gray-500">
            {role === "company"
              ? "No matches yet. Post a proposal — AI matching runs automatically."
              : "No matches yet. They appear here once a company posts a proposal."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).map(([key, group]) => (
            <div
              key={key}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Proposal header — click to collapse/expand */}
              <button
                onClick={() => toggleGroup(key)}
                className="w-full flex items-center justify-between gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-red-600 shrink-0" />
                  <p className="text-sm font-semibold text-gray-800">
                    {group.title}
                  </p>
                  <span className="text-xs text-gray-400">
                    ({group.items.length})
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${collapsed[key] ? "-rotate-90" : ""}`}
                />
              </button>

              {/* Freelancer rows */}
              {!collapsed[key] && (
                <ul className="divide-y divide-gray-100">
                  {group.items.map((match) => {
                    const actionable = needsAction(match);
                    const busy = respondingId === match.id;
                    return (
                      <li
                        key={match.id}
                        className={`px-5 py-4 ${actionable ? "" : "opacity-70"}`}
                      >
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          {/* Name + category */}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {freelancerName(match)}
                            </p>
                            {match.freelancer?.freelance_category && (
                              <p className="text-xs text-gray-400">
                                {match.freelancer.freelance_category}
                              </p>
                            )}
                          </div>

                          {/* Status badge + links */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span
                              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLE[match.status] || "bg-gray-100 text-gray-500"}`}
                            >
                              {match.status.replace(/_/g, " ")}
                            </span>
                            <button
                              onClick={() =>
                                router.push(
                                  `/home/profiles/${match.freelancer_user_id}`,
                                )
                              }
                              className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                            >
                              <User className="w-3.5 h-3.5" /> Profile
                            </button>
                            {match.freelancer?.cv_path && (
                              <a
                                href={`http://localhost:8000/api/users/${match.freelancer_user_id}/cv`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" /> CV
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        {actionable && (
                          <div className="flex gap-2 mt-3">
                            <button
                              className="btn flex-1 flex items-center justify-center gap-2 text-sm"
                              disabled={busy}
                              onClick={() => respond(match.id, true)}
                            >
                              {busy ? (
                                <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              {role === "company" ? "Approve" : "Accept"}
                            </button>
                            <button
                              className="btn-secondary flex items-center justify-center gap-2 text-sm px-4"
                              disabled={busy}
                              onClick={() => respond(match.id, false)}
                            >
                              <XCircle className="w-4 h-4 text-red-500" />{" "}
                              Reject
                            </button>
                          </div>
                        )}

                        {canRemoveApproval(match) && !actionable && (
                          <div className="mt-3">
                            <button
                              className="btn-secondary flex items-center gap-2 text-sm px-4"
                              disabled={busy}
                              onClick={() => removeApproval(match.id)}
                            >
                              <XCircle className="w-4 h-4 text-gray-500" />{" "}
                              Remove Approval
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
