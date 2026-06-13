"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Zap, Send, CheckCircle2, Clock } from "lucide-react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
import SearchBar from "@/components/protected/SearchBar";
import Modal from "@/components/protected/Modal";

type Proposal = {
  id: number;
  title: string;
  description: string;
  required_skills: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  timeline: string | null;
  status: string;
  company?: { company_name?: string; contact_first_name?: string; contact_last_name?: string; industry?: string };
};

const STATUS_STYLE: Record<string, string> = {
  draft:   "bg-gray-100 text-gray-500",
  open:    "bg-blue-50 text-blue-700",
  matched: "bg-emerald-50 text-emerald-700",
  closed:  "bg-red-50 text-red-600",
};

const EMPTY_FORM = { title: "", description: "", required_skills: "", budget_min: "", budget_max: "", timeline: "" };

export default function HomeProposalPage() {
  const role   = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const userId = typeof window !== "undefined" ? Number(localStorage.getItem("userId") || 0) : 0;

  const [proposals,    setProposals]    = useState<Proposal[]>([]);
  // proposalId → match status / match id for the current freelancer
  const [matchStatusMap, setMatchStatusMap] = useState<Record<number, string>>({});
  const [matchIdMap,     setMatchIdMap]     = useState<Record<number, number>>({});
  const [loading,      setLoading]      = useState(true);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [rematchId,         setRematchId]         = useState<number | null>(null);
  const [applyingId,        setApplyingId]        = useState<number | null>(null);
  const [confirmingMatchId, setConfirmingMatchId] = useState<number | null>(null);
  const [removingId,        setRemovingId]        = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form,  setForm]  = useState(EMPTY_FORM);
  const [query, setQuery] = useState("");

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadProposals = useCallback(async () => {
    if (!userId) return;
    try {
      const [proposalsRes, matchesRes] = await Promise.all([
        api.get("/proposals", { params: { actor_user_id: userId } }),
        role === "freelancer"
          ? api.get("/matches", { params: { actor_user_id: userId } })
          : Promise.resolve({ data: [] }),
      ]);
      setProposals(proposalsRes.data || []);
      if (role === "freelancer") {
        const statusMap: Record<number, string> = {};
        const idMap: Record<number, number> = {};
        (matchesRes.data || [])
          .filter((m: { freelancer_user_id: number }) => m.freelancer_user_id === userId)
          .forEach((m: { id: number; proposal_id: number; status: string }) => {
            statusMap[m.proposal_id] = m.status;
            idMap[m.proposal_id] = m.id;
          });
        setMatchStatusMap(statusMap);
        setMatchIdMap(idMap);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => { loadProposals(); }, [loadProposals]);

  const rerunMatching = async (proposalId: number) => {
    setRematchId(proposalId);
    try {
      await api.post(`/proposals/${proposalId}/match`, { actor_user_id: userId });
      showToast("success", "AI matching re-ran successfully.");
      await loadProposals();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Matching failed.");
    } finally {
      setRematchId(null);
    }
  };

  const removeApplication = async (proposalId: number) => {
    const matchId = matchIdMap[proposalId];
    if (!matchId) return;
    setRemovingId(proposalId);
    try {
      await api.post(`/matches/${matchId}/respond`, { actor_user_id: userId, approve: false, remove_approval: true });
      showToast("success", "Application removed.");
      await loadProposals();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Could not remove application.");
    } finally {
      setRemovingId(null);
    }
  };

  const confirmAiMatch = async (proposalId: number) => {
    const matchId = matchIdMap[proposalId];
    if (!matchId) return;
    setConfirmingMatchId(proposalId);
    try {
      await api.post(`/matches/${matchId}/respond`, { actor_user_id: userId, approve: true });
      showToast("success", "Application submitted!");
      await loadProposals();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Application failed.");
    } finally {
      setConfirmingMatchId(null);
    }
  };

  const applyToJob = async (proposalId: number) => {
    setApplyingId(proposalId);
    try {
      await api.post(`/proposals/${proposalId}/apply`, { actor_user_id: userId });
      showToast("success", "Application submitted!");
      await loadProposals();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Application failed.");
    } finally {
      setApplyingId(null);
    }
  };

  const createProposal = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      showToast("error", "Title and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/proposals", {
        actor_user_id: userId,
        company_user_id: userId,
        title: form.title.trim(),
        description: form.description.trim(),
        required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        timeline: form.timeline || null,
      });
      setForm(EMPTY_FORM);
      setModalOpen(false);
      showToast("success", "Proposal posted! AI matching is running in the background…");
      await loadProposals();
      // Fire matching without blocking — result visible after a manual reload or re-run
      const newId = res.data?.proposal?.id;
      if (newId) {
        api.post(`/proposals/${newId}/match`, { actor_user_id: userId }).catch(() => {});
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Proposal creation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Derive the visible proposal status badge for freelancers
  const proposalBadgeStatus = (proposal: Proposal): string => {
    if (role !== "freelancer") return proposal.status;
    const myStatus = matchStatusMap[proposal.id];
    // If the proposal is "matched" but this freelancer isn't in it, show "open"
    if (proposal.status === "matched" && !myStatus) return "open";
    return proposal.status;
  };

  // Render the apply button / status chip for a freelancer
  const renderApplyAction = (proposal: Proposal) => {
    const myStatus = matchStatusMap[proposal.id];
    const busy     = applyingId === proposal.id;

    if (!myStatus || myStatus === "rejected") {
      return (
        <button
          onClick={() => applyToJob(proposal.id)}
          disabled={busy}
          className="btn text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-60"
        >
          {busy
            ? <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            : <Send className="w-3 h-3" />}
          {myStatus === "rejected" ? "Apply Again" : "Apply"}
        </button>
      );
    }

    if (myStatus === "freelancer_approved") {
      const busy = removingId === proposal.id;
      return (
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Applied
          </span>
          <button
            onClick={() => removeApplication(proposal.id)}
            disabled={busy}
            className="text-xs text-red-600 hover:text-red-700 underline underline-offset-2 disabled:opacity-50"
          >
            {busy ? "Removing…" : "Remove Application"}
          </button>
        </div>
      );
    }

    if (myStatus === "company_approved") {
      return (
        <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Zap className="w-3 h-3" /> Review in Matching
        </span>
      );
    }

    if (myStatus === "mutual_approved") {
      return (
        <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Hired ✓
        </span>
      );
    }

    if (myStatus === "pending") {
      const busy = confirmingMatchId === proposal.id;
      return (
        <button
          onClick={() => confirmAiMatch(proposal.id)}
          disabled={busy}
          className="btn text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-60"
        >
          {busy
            ? <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            : <Send className="w-3 h-3" />}
          Apply
        </button>
      );
    }

    return null;
  };

  const filteredProposals = proposals.filter((p) => {
    const q = query.trim().toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.required_skills || []).some((s) => s.toLowerCase().includes(q));
  });

  return (
    <>
      <SectionShell
        title={role === "company" ? "Job Proposals" : "Jobs"}
        description={
          role === "company"
            ? "Post job proposals and run BERT-powered AI matching to find the best freelancers."
            : "Browse all open job opportunities posted by companies."
        }
        actions={undefined}
      >
        <SearchBar value={query} onChange={setQuery} placeholder="Search by title, skill, or description…" />

        {toast && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${toast.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {toast.text}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {role === "company" ? "Your Proposals" : "All Jobs"}
          </h2>

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : filteredProposals.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                {query
                  ? `No proposals match "${query}".`
                  : role === "company"
                  ? "No proposals yet. Use the + button to post your first job."
                  : "No open proposals right now. Check back soon."}
              </p>
            </div>
          ) : (
            filteredProposals.map((proposal) => {
              const badgeStatus = proposalBadgeStatus(proposal);
              return (
                <div key={proposal.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{proposal.title}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[badgeStatus] || "bg-gray-100 text-gray-500"}`}>
                          {badgeStatus}
                        </span>
                      </div>
                      {role === "freelancer" && proposal.company && (
                        <p className="text-xs text-gray-400 mb-1">
                          {proposal.company.company_name?.trim() ||
                            [proposal.company.contact_first_name, proposal.company.contact_last_name].filter(Boolean).join(" ") || ""}
                          {proposal.company.industry ? ` · ${proposal.company.industry}` : ""}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">{proposal.description}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        {(proposal.budget_min != null || proposal.budget_max != null) && (
                          <span>Budget: ${proposal.budget_min ?? "?"} – ${proposal.budget_max ?? "?"}</span>
                        )}
                        {proposal.timeline && <span>Timeline: {proposal.timeline}</span>}
                      </div>
                      {proposal.required_skills?.length ? (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {proposal.required_skills.map((skill) => (
                            <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-start gap-2 shrink-0 sm:pt-0.5 flex-wrap">
                      {role === "freelancer" && renderApplyAction(proposal)}

                      {role === "company" && proposal.status === "matched" && (
                        <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Zap className="w-3 h-3" /> AI Matched
                        </span>
                      )}
                      {role === "company" && (
                        <button
                          onClick={() => rerunMatching(proposal.id)}
                          disabled={rematchId === proposal.id}
                          className="text-xs text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded-full flex items-center gap-1 transition disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${rematchId === proposal.id ? "animate-spin" : ""}`} />
                          {rematchId === proposal.id ? "Matching…" : "Re-run Matching"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SectionShell>

      {role === "company" && (
        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95"
          aria-label="New proposal"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setForm(EMPTY_FORM); }} title="Post New Proposal">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Job Title *</label>
            <input className="input" placeholder="e.g. Senior React Developer" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <textarea className="input min-h-28 resize-none" placeholder="Describe deliverables, stack, and expectations..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Required Skills</label>
            <input className="input" placeholder="React, TypeScript, Node.js" value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Budget Min ($)</label>
              <input className="input" placeholder="500" type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Budget Max ($)</label>
              <input className="input" placeholder="5000" type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Timeline</label>
            <input className="input" placeholder="e.g. 4 weeks" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn flex-1" onClick={createProposal} disabled={submitting}>
              {submitting ? "Posting..." : "Post Proposal"}
            </button>
            <button className="btn-secondary flex-1" onClick={() => { setModalOpen(false); setForm(EMPTY_FORM); }}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
