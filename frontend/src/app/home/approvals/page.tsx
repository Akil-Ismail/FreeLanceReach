"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";

type Match = {
  id: number;
  status: string;
  proposal_id: number;
  freelancer_user_id: number;
  match_score?: number;
  model_source?: string;
  proposal?: { title?: string; description?: string };
  freelancer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    freelance_category?: string;
  };
  company?: { company_name?: string; contact_first_name?: string };
};

const STATUS_META: Record<string, { label: string; style: string }> = {
  pending: { label: "Pending", style: "bg-gray-100 text-gray-600" },
  company_approved: {
    label: "Company Approved",
    style: "bg-blue-50 text-blue-700",
  },
  freelancer_approved: {
    label: "Freelancer Approved",
    style: "bg-amber-50 text-amber-700",
  },
  mutual_approved: {
    label: "Mutually Approved",
    style: "bg-emerald-50 text-emerald-700",
  },
  rejected: { label: "Rejected", style: "bg-red-50 text-red-600" },
};

export default function HomeApprovalsPage() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const userId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("userId") || 0)
      : 0;

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.get("/matches", {
        params: { actor_user_id: userId },
      });
      setMatches(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (matchId: number, approve: boolean) => {
    setLoadingId(matchId);
    try {
      await api.post(`/matches/${matchId}/respond`, {
        actor_user_id: userId,
        approve,
      });
      showToast("success", approve ? "Match approved." : "Match rejected.");
      await load();
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
      setLoadingId(null);
    }
  };

  const needsMyAction = (m: Match) => {
    if (role === "company")
      return m.status === "pending" || m.status === "freelancer_approved";
    if (role === "freelancer")
      return m.status === "pending" || m.status === "company_approved";
    return false;
  };

  const pending = matches.filter(needsMyAction);
  const decided = matches.filter((m) => !needsMyAction(m));

  const freelancerName = (m: Match) => {
    const f = m.freelancer;
    if (!f) return `Freelancer #${m.freelancer_user_id}`;
    return (
      `${f.first_name || ""} ${f.last_name || ""}`.trim() ||
      f.email ||
      `#${m.freelancer_user_id}`
    );
  };

  const scorePercent = (score?: number) =>
    score != null ? Math.round(Number(score) * 100) : null;

  return (
    <SectionShell
      title="Approvals"
      description={
        role === "company"
          ? "Review AI-matched freelancers and approve or reject candidates for your proposals."
          : "Review job matches and accept or decline opportunities from companies."
      }
    >
      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {toast.text}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
          Loading matches...
        </div>
      ) : (
        <>
          {/* Awaiting action */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Awaiting Your Decision ({pending.length})
            </h2>

            {pending.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No pending decisions. You&apos;re all caught up.
                </p>
              </div>
            ) : (
              pending.map((match) => {
                const pct = scorePercent(match.match_score);
                const scoreClass =
                  pct != null && pct >= 70
                    ? "text-emerald-600"
                    : pct != null && pct >= 45
                      ? "text-amber-600"
                      : "text-red-500";
                const meta = STATUS_META[match.status] || {
                  label: match.status,
                  style: "bg-gray-100 text-gray-600",
                };

                return (
                  <div
                    key={match.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <div className="flex-1 min-w-0">
                        {/* Proposal */}
                        <p className="text-xs text-gray-400 mb-0.5">Proposal</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {match.proposal?.title ||
                            `Proposal #${match.proposal_id}`}
                        </p>

                        {/* Freelancer (company view) / Company (freelancer view) */}
                        {role === "company" && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-400 mb-0.5">
                              Freelancer
                            </p>
                            <p className="text-sm text-gray-800 font-medium">
                              {freelancerName(match)}
                            </p>
                            {match.freelancer?.freelance_category && (
                              <p className="text-xs text-gray-500">
                                {match.freelancer.freelance_category}
                              </p>
                            )}
                          </div>
                        )}

                        {role === "freelancer" && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-400 mb-0.5">
                              Company
                            </p>
                            <p className="text-sm text-gray-800 font-medium">
                              {match.company?.company_name ||
                                match.company?.contact_first_name ||
                                `Company #${match.freelancer_user_id}`}
                            </p>
                            {match.proposal?.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {match.proposal.description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.style}`}
                        >
                          {meta.label}
                        </span>
                        {pct != null && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">
                              AI Match Score
                            </p>
                            <p className={`text-lg font-bold ${scoreClass}`}>
                              {pct}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score bar */}
                    {pct != null && (
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-4">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 70
                              ? "bg-emerald-500"
                              : pct >= 45
                                ? "bg-amber-400"
                                : "bg-red-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}

                    <div className="flex gap-2 border-t border-gray-100 pt-4">
                      <button
                        className="btn flex-1 flex items-center justify-center gap-2 text-sm"
                        disabled={loadingId === match.id}
                        onClick={() => respond(match.id, true)}
                      >
                        {loadingId === match.id ? (
                          <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        {role === "company"
                          ? "Approve Freelancer"
                          : "Accept Opportunity"}
                      </button>
                      <button
                        className="btn-secondary flex items-center justify-center gap-2 text-sm px-4"
                        disabled={loadingId === match.id}
                        onClick={() => respond(match.id, false)}
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Already decided */}
          {decided.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Past Decisions ({decided.length})
              </h2>
              {decided.map((match) => {
                const pct = scorePercent(match.match_score);
                const meta = STATUS_META[match.status] || {
                  label: match.status,
                  style: "bg-gray-100 text-gray-600",
                };
                return (
                  <div
                    key={match.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 opacity-70"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {match.proposal?.title ||
                          `Proposal #${match.proposal_id}`}
                      </p>
                      {role === "company" && (
                        <p className="text-xs text-gray-500">
                          {freelancerName(match)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {pct != null && (
                        <span className="text-xs text-gray-400">{pct}%</span>
                      )}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.style}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </SectionShell>
  );
}
