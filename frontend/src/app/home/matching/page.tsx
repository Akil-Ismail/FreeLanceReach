"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, RefreshCw, FileText, User } from "lucide-react";
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
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    freelance_category?: string;
    cv_path?: string | null;
  };
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-500",
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
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
        const proposals: { id: number }[] = proposalsRes.data || [];
        await Promise.all(
          proposals.map((p) =>
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

  const needsAction = (m: Match) => {
    if (role === "company")
      return m.status === "pending" || m.status === "freelancer_approved";
    if (role === "freelancer")
      return m.status === "pending" || m.status === "company_approved";
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

  const pct = (score: number) => Math.round(Number(score) * 100);

  // Sort: pending action first, then by score desc; hide matches under 40%
  const sorted = [...matches]
    .filter((m) => Math.round(Number(m.match_score) * 100) >= 40)
    .sort((a, b) => {
      const aAct = needsAction(a) ? 1 : 0;
      const bAct = needsAction(b) ? 1 : 0;
      if (bAct !== aAct) return bAct - aAct;
      return Number(b.match_score) - Number(a.match_score);
    });

  return (
    <SectionShell
      title="Matching"
      description="AI automatically scores and ranks freelancers whenever a proposal is posted. Approve or reject candidates to move them forward."
      actions={
        <button
          className="btn-secondary text-sm flex items-center gap-2"
          onClick={() => rerunAndRefresh()}
          disabled={refreshing}
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      }
    >
      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${toast.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
        >
          {toast.text}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Match Results {!loading && `(${sorted.length})`}
        </h2>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
            Loading matches...
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <p className="text-sm text-gray-500">
              {role === "company"
                ? "No matches yet. Post a proposal — AI matching runs automatically."
                : "No matches yet. They appear here once a company posts a proposal."}
            </p>
          </div>
        ) : (
          sorted.map((match) => {
            const score = pct(match.match_score);
            const barColor =
              score >= 70
                ? "bg-emerald-500"
                : score >= 45
                  ? "bg-amber-400"
                  : "bg-red-400";
            const scoreColor =
              score >= 70
                ? "text-emerald-600"
                : score >= 45
                  ? "text-amber-600"
                  : "text-red-500";
            const meta =
              STATUS_STYLE[match.status] || "bg-gray-100 text-gray-500";
            const actionable = needsAction(match);

            return (
              <div
                key={match.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition ${
                  actionable
                    ? "border-gray-200 hover:border-gray-300"
                    : "border-gray-100 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {freelancerName(match)}
                      </p>
                      {match.freelancer?.freelance_category && (
                        <span className="text-xs text-gray-400">
                          {match.freelancer.freelance_category}
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta}`}
                      >
                        {match.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {match.proposal?.title ||
                        `Proposal #${match.proposal_id}`}
                      <span className="mx-1">·</span>
                      <span className="italic">{match.model_source}</span>
                    </p>

                    {/* Score bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span
                        className={`text-sm font-bold w-10 text-right ${scoreColor}`}
                      >
                        {score}%
                      </span>
                    </div>

                    {/* Profile + CV links */}
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/home/profiles/${match.freelancer_user_id}`,
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:underline font-medium"
                      >
                        <User className="w-3.5 h-3.5" /> View Profile
                      </button>
                      {match.freelancer?.cv_path && (
                        <a
                          href={`http://localhost:8000/api/users/${match.freelancer_user_id}/cv`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View CV
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Approve / reject */}
                {actionable && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      className="btn flex-1 flex items-center justify-center gap-2 text-sm"
                      disabled={respondingId === match.id}
                      onClick={() => respond(match.id, true)}
                    >
                      {respondingId === match.id ? (
                        <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {role === "company" ? "Approve" : "Accept"}
                    </button>
                    <button
                      className="btn-secondary flex items-center justify-center gap-2 text-sm px-4"
                      disabled={respondingId === match.id}
                      onClick={() => respond(match.id, false)}
                    >
                      <XCircle className="w-4 h-4 text-red-500" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </SectionShell>
  );
}
