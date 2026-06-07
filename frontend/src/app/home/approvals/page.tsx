"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
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
  const [undoingId, setUndoingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const removeRejection = async (matchId: number) => {
    setUndoingId(matchId);
    try {
      await api.post(`/matches/${matchId}/respond`, {
        actor_user_id: userId,
        approve: false,
        remove_approval: true,
      });
      showToast("success", "Rejection removed — match reset to pending.");
      await load();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Could not remove rejection.");
    } finally {
      setUndoingId(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approved = matches.filter((m) => m.status !== "rejected" && m.status !== "pending");
  const rejected = matches.filter((m) => m.status === "rejected");

  const freelancerName = (m: Match) => {
    const f = m.freelancer;
    if (!f) return `Freelancer #${m.freelancer_user_id}`;
    return (
      `${f.first_name || ""} ${f.last_name || ""}`.trim() ||
      f.email ||
      `#${m.freelancer_user_id}`
    );
  };

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
          {approved.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No approved matches yet.</p>
            </div>
          )}

          {approved.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Approved ({approved.length})
              </h2>
              {approved.map((match) => {
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

          {rejected.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Rejected ({rejected.length})
              </h2>
              {rejected.map((match) => {
                return (
                  <div
                    key={match.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 opacity-60"
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
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                        Rejected
                      </span>
                      <button
                        className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition disabled:opacity-40"
                        disabled={undoingId === match.id}
                        onClick={() => removeRejection(match.id)}
                      >
                        {undoingId === match.id ? "..." : "Remove Rejection"}
                      </button>
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
