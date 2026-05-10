"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Zap, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
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
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500",
  open: "bg-blue-50 text-blue-700",
  matched: "bg-emerald-50 text-emerald-700",
  closed: "bg-red-50 text-red-600",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  required_skills: "",
  budget_min: "",
  budget_max: "",
  timeline: "",
};

export default function HomeProposalPage() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const userId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("userId") || 0)
      : 0;

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rematchId, setRematchId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadProposals = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get("/proposals", {
        params: { actor_user_id: userId },
      });
      setProposals(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const rerunMatching = async (proposalId: number) => {
    setRematchId(proposalId);
    try {
      await api.post(`/proposals/${proposalId}/match`, {
        actor_user_id: userId,
      });
      showToast("success", "AI matching re-ran successfully.");
      await loadProposals();
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        e.response?.data?.message || e.message || "Matching failed.",
      );
    } finally {
      setRematchId(null);
    }
  };

  const createProposal = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      showToast("error", "Title and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/proposals", {
        actor_user_id: userId,
        company_user_id: userId,
        title: form.title.trim(),
        description: form.description.trim(),
        required_skills: form.required_skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        timeline: form.timeline || null,
      });
      setForm(EMPTY_FORM);
      setModalOpen(false);
      showToast("success", "Proposal posted successfully.");
      await loadProposals();
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        e.response?.data?.message || e.message || "Proposal creation failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SectionShell
        title="Proposals"
        description={
          role === "company"
            ? "Post job proposals and run BERT-powered AI matching to find the best freelancers."
            : "Browse open opportunities matched to your profile."
        }
        actions={
          role === "freelancer" ? (
            <Link
              href="/ai-proposal-generator"
              className="btn flex items-center gap-2 text-sm"
            >
              <Zap className="w-4 h-4" /> Generate with AI
            </Link>
          ) : undefined
        }
      >
        {/* Toast */}
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

        {/* List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {role === "company" ? "Your Proposals" : "Open Opportunities"}
          </h2>

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
              Loading...
            </div>
          ) : proposals.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                {role === "company"
                  ? "No proposals yet. Use the + button to post your first job."
                  : "No open proposals right now. Check back soon."}
              </p>
            </div>
          ) : (
            proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {proposal.title}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          STATUS_STYLE[proposal.status] ||
                          "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {proposal.description}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      {(proposal.budget_min != null ||
                        proposal.budget_max != null) && (
                        <span>
                          Budget: ${proposal.budget_min ?? "?"} – $
                          {proposal.budget_max ?? "?"}
                        </span>
                      )}
                      {proposal.timeline && (
                        <span>Timeline: {proposal.timeline}</span>
                      )}
                    </div>

                    {proposal.required_skills?.length ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {proposal.required_skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {proposal.status === "matched" && (
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
                        <RefreshCw
                          className={`w-3 h-3 ${rematchId === proposal.id ? "animate-spin" : ""}`}
                        />
                        {rematchId === proposal.id
                          ? "Matching…"
                          : "Re-run Matching"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionShell>

      {/* Floating + button (company only) */}
      {role === "company" && (
        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95"
          aria-label="New proposal"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Create modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setForm(EMPTY_FORM);
        }}
        title="Post New Proposal"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Job Title *
            </label>
            <input
              className="input"
              placeholder="e.g. Senior React Developer"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description *
            </label>
            <textarea
              className="input min-h-28 resize-none"
              placeholder="Describe deliverables, stack, and expectations..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Required Skills
            </label>
            <input
              className="input"
              placeholder="React, TypeScript, Node.js"
              value={form.required_skills}
              onChange={(e) =>
                setForm({ ...form, required_skills: e.target.value })
              }
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Budget Min ($)
              </label>
              <input
                className="input"
                placeholder="500"
                type="number"
                value={form.budget_min}
                onChange={(e) =>
                  setForm({ ...form, budget_min: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Budget Max ($)
              </label>
              <input
                className="input"
                placeholder="5000"
                type="number"
                value={form.budget_max}
                onChange={(e) =>
                  setForm({ ...form, budget_max: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Timeline
            </label>
            <input
              className="input"
              placeholder="e.g. 4 weeks"
              value={form.timeline}
              onChange={(e) => setForm({ ...form, timeline: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="btn flex-1"
              onClick={createProposal}
              disabled={submitting}
            >
              {submitting ? "Posting..." : "Post Proposal"}
            </button>
            <button
              className="btn-secondary flex-1"
              onClick={() => {
                setModalOpen(false);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
