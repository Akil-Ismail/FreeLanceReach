"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";

type Match = {
  id: number;
  status: string;
  proposal_id: number;
  freelancer_user_id: number;
  proposal?: { title?: string; description?: string };
  freelancer?: { first_name?: string; last_name?: string; email?: string; freelance_category?: string };
  company?: { company_name?: string; contact_first_name?: string };
};

type PipelineStage = "meeting_scheduled" | "awaiting_contract" | "hired";

function getPipelineStage(
  matchId: number,
  meetings: { proposal_match_id: number; status: string }[],
  contracts: { proposal_match_id: number; status: string }[],
): PipelineStage {
  const contract = contracts.find(c => c.proposal_match_id === matchId);
  if (contract?.status === "active") return "hired";
  if (contract) return "awaiting_contract";
  const meeting = meetings.find(m => m.proposal_match_id === matchId);
  if (meeting) return "meeting_scheduled";
  return "meeting_scheduled";
}

const PIPELINE_META: Record<PipelineStage, { label: string; style: string }> = {
  meeting_scheduled: { label: "Meeting Scheduled",  style: "bg-blue-50 text-blue-700" },
  awaiting_contract: { label: "Awaiting Contract",  style: "bg-amber-50 text-amber-700" },
  hired:             { label: "Hired ✓",            style: "bg-emerald-50 text-emerald-700" },
};

const STATUS_META: Record<string, { label: string; style: string }> = {
  pending:            { label: "Pending",           style: "bg-gray-100 text-gray-600" },
  company_approved:   { label: "Company Approved",  style: "bg-blue-50 text-blue-700" },
  freelancer_approved:{ label: "Freelancer Approved",style: "bg-amber-50 text-amber-700" },
  mutual_approved:    { label: "Mutually Approved", style: "bg-emerald-50 text-emerald-700" },
  rejected:           { label: "Rejected",          style: "bg-red-50 text-red-600" },
};

export default function HomeApprovalsPage() {
  const role   = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const userId = typeof window !== "undefined" ? Number(localStorage.getItem("userId") || 0) : 0;

  const [matches,      setMatches]      = useState<Match[]>([]);
  const [meetings,     setMeetings]     = useState<{ proposal_match_id: number; status: string }[]>([]);
  const [contracts,    setContracts]    = useState<{ proposal_match_id: number; status: string }[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [matchRes, meetingRes, contractRes] = await Promise.all([
        api.get("/matches",   { params: { actor_user_id: userId } }),
        api.get("/meetings",  { params: { actor_user_id: userId } }).catch(() => ({ data: [] })),
        api.get("/contracts", { params: { actor_user_id: userId } }).catch(() => ({ data: [] })),
      ]);
      setMatches(matchRes.data || []);
      setMeetings(meetingRes.data || []);
      setContracts(contractRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const respond = async (matchId: number, approve: boolean, removeApproval = false) => {
    setRespondingId(matchId);
    try {
      await api.post(`/matches/${matchId}/respond`, {
        actor_user_id: userId,
        approve,
        ...(removeApproval && { remove_approval: true }),
      });
      showToast("success",
        removeApproval ? "Action undone." :
        approve ? "Approved successfully." : "Rejected successfully."
      );
      await load();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Action failed.");
    } finally {
      setRespondingId(null);
    }
  };

  useEffect(() => { load(); }, []);

  const freelancerName = (m: Match) => {
    const f = m.freelancer;
    if (!f) return `Freelancer #${m.freelancer_user_id}`;
    return `${f.first_name || ""} ${f.last_name || ""}`.trim() || f.email || `#${m.freelancer_user_id}`;
  };

  const proposalTitle = (m: Match) => m.proposal?.title || `Proposal #${m.proposal_id}`;

  // ── Company buckets ──────────────────────────────────────────────────────
  const companyPending  = matches.filter(m => m.status === "freelancer_approved");
  const companyApproved = matches.filter(m => m.status === "company_approved" || m.status === "mutual_approved");
  const companyRejected = matches.filter(m => m.status === "rejected");

  // ── Freelancer buckets ───────────────────────────────────────────────────
  const freelancerPending  = matches.filter(m => m.status === "company_approved");
  const freelancerApplied  = matches.filter(m => m.status === "freelancer_approved");
  const freelancerApproved = matches.filter(m => m.status === "mutual_approved");
  const freelancerRejected = matches.filter(m => m.status === "rejected");

  const busy = (id: number) => respondingId === id;

  return (
    <SectionShell
      title="Approvals"
      description={
        role === "company"
          ? "Review freelancer applications and approve or reject candidates."
          : "Review company offers and accept or decline opportunities."
      }
    >
      {toast && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${toast.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {toast.text}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
          Loading matches...
        </div>
      ) : role === "company" ? (
        /* ═══════════════ COMPANY VIEW ═══════════════ */
        <>
          {companyPending.length === 0 && companyApproved.length === 0 && companyRejected.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No applications yet. Post a proposal and run AI matching to find candidates.</p>
            </div>
          )}

          {/* Awaiting company review */}
          {companyPending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Awaiting Your Review ({companyPending.length})
              </h2>
              {companyPending.map(match => (
                <div key={match.id} className="bg-white border border-amber-100 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{proposalTitle(match)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{freelancerName(match)}</p>
                    {match.freelancer?.freelance_category && (
                      <p className="text-xs text-gray-400">{match.freelancer.freelance_category}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={busy(match.id)}
                      onClick={() => respond(match.id, true)}
                      className="btn text-sm flex items-center gap-1.5 px-4"
                    >
                      {busy(match.id) ? <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      disabled={busy(match.id)}
                      onClick={() => respond(match.id, false)}
                      className="btn-secondary text-sm flex items-center gap-1.5 px-4"
                    >
                      <XCircle className="w-4 h-4 text-red-500" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Already approved */}
          {companyApproved.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Approved ({companyApproved.length})
              </h2>
              {companyApproved.map(match => {
                const stage = match.status === "mutual_approved"
                  ? PIPELINE_META[getPipelineStage(match.id, meetings, contracts)]
                  : STATUS_META[match.status] || { label: match.status, style: "bg-gray-100 text-gray-600" };
                return (
                  <div key={match.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 opacity-75">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{proposalTitle(match)}</p>
                      <p className="text-xs text-gray-500">{freelancerName(match)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stage.style}`}>{stage.label}</span>
                      {(match.status === "company_approved" || match.status === "mutual_approved") && (
                        <button
                          disabled={busy(match.id)}
                          onClick={() => respond(match.id, false, true)}
                          className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5 text-gray-500" />
                          {busy(match.id) ? "…" : "Remove Approval"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rejected */}
          {companyRejected.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                Rejected ({companyRejected.length})
              </h2>
              {companyRejected.map(match => (
                <div key={match.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 opacity-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{proposalTitle(match)}</p>
                    <p className="text-xs text-gray-500">{freelancerName(match)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">Rejected</span>
                    <button
                      disabled={busy(match.id)}
                      onClick={() => respond(match.id, false, true)}
                      className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 disabled:opacity-40"
                    >
                      {busy(match.id) ? "…" : "Undo"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* ═══════════════ FREELANCER VIEW ═══════════════ */
        <>
          {freelancerPending.length === 0 && freelancerApplied.length === 0 && freelancerApproved.length === 0 && freelancerRejected.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No matches yet. Browse jobs and apply to get started.</p>
            </div>
          )}

          {/* Company wants you — needs your decision */}
          {freelancerPending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Company Approved You — Your Turn ({freelancerPending.length})
              </h2>
              {freelancerPending.map(match => (
                <div key={match.id} className="bg-white border border-amber-100 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{proposalTitle(match)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={busy(match.id)}
                      onClick={() => respond(match.id, true)}
                      className="btn text-sm flex items-center gap-1.5 px-4"
                    >
                      {busy(match.id) ? <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Accept
                    </button>
                    <button
                      disabled={busy(match.id)}
                      onClick={() => respond(match.id, false)}
                      className="btn-secondary text-sm flex items-center gap-1.5 px-4"
                    >
                      <XCircle className="w-4 h-4 text-red-500" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Applied — waiting for company */}
          {freelancerApplied.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Applied — Awaiting Company ({freelancerApplied.length})
              </h2>
              {freelancerApplied.map(match => (
                <div key={match.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 opacity-75">
                  <p className="text-sm font-medium text-gray-800">{proposalTitle(match)}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Applied</span>
                    <button
                      disabled={busy(match.id)}
                      onClick={() => respond(match.id, false)}
                      className="text-xs text-gray-500 hover:text-red-600 underline underline-offset-2 disabled:opacity-40"
                    >
                      {busy(match.id) ? "…" : "Withdraw"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mutually approved */}
          {freelancerApproved.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Matched ({freelancerApproved.length})
              </h2>
              {freelancerApproved.map(match => {
                const stage = PIPELINE_META[getPipelineStage(match.id, meetings, contracts)];
                return (
                  <div key={match.id} className="bg-white border border-emerald-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-gray-900">{proposalTitle(match)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stage.style}`}>{stage.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rejected */}
          {freelancerRejected.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                Rejected ({freelancerRejected.length})
              </h2>
              {freelancerRejected.map(match => (
                <div key={match.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 opacity-50">
                  <p className="text-sm font-medium text-gray-800">{proposalTitle(match)}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">Rejected</span>
                    <button
                      disabled={busy(match.id)}
                      onClick={() => respond(match.id, false, true)}
                      className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 disabled:opacity-40"
                    >
                      {busy(match.id) ? "…" : "Remove Rejection"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </SectionShell>
  );
}
