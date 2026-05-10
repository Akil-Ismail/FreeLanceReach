"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, FileText } from "lucide-react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
import Modal from "@/components/protected/Modal";

type Contract = {
  id: number;
  status: string;
  contract_text: string;
  proposal_match_id: number;
  company_user_id: number;
  freelancer_user_id: number;
  company?: { company_name?: string; contact_first_name?: string };
  freelancer?: { first_name?: string; last_name?: string; email?: string };
};

type Match = {
  id: number;
  proposal_id: number;
  freelancer_user_id: number;
  status: string;
  freelancer?: { first_name?: string; last_name?: string; email?: string };
  proposal?: { title?: string };
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500",
  company_signed: "bg-blue-50 text-blue-700",
  freelancer_signed: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

const EMPTY_FORM = {
  proposal_match_id: "",
  freelancer_user_id: "",
  scope: "",
  payment_terms: "",
  timeline: "",
};

export default function HomeContractsPage() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const userId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("userId") || 0)
      : 0;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [mutualMatches, setMutualMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  );
  const [signature, setSignature] = useState("");
  const [signingId, setSigningId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadContracts = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get("/contracts", {
        params: { actor_user_id: userId },
      });
      setContracts(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMutualMatches = useCallback(async () => {
    if (!userId || role !== "company") return;
    const res = await api.get("/matches", {
      params: { actor_user_id: userId },
    });
    setMutualMatches(
      (res.data || []).filter((m: Match) => m.status === "mutual_approved"),
    );
  }, [userId, role]);

  useEffect(() => {
    loadContracts();
    loadMutualMatches();
  }, [loadContracts, loadMutualMatches]);

  const createContract = async () => {
    if (!form.proposal_match_id || !form.scope.trim()) {
      showToast(
        "error",
        "Please select a match and describe the scope of work.",
      );
      return;
    }
    setCreating(true);
    try {
      await api.post("/contracts", {
        actor_user_id: userId,
        company_user_id: userId,
        proposal_match_id: Number(form.proposal_match_id),
        freelancer_user_id: Number(form.freelancer_user_id),
        details: {
          scope: form.scope,
          payment_terms: form.payment_terms,
          timeline: form.timeline,
        },
      });
      setForm(EMPTY_FORM);
      setModalOpen(false);
      showToast(
        "success",
        "Contract draft created. Both parties can now review and sign.",
      );
      await loadContracts();
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        e.response?.data?.message || e.message || "Contract creation failed.",
      );
    } finally {
      setCreating(false);
    }
  };

  const sign = async (contractId: number, approve: boolean) => {
    if (!signature.trim()) {
      showToast("error", "Please enter your digital signature.");
      return;
    }
    setSigningId(contractId);
    try {
      await api.post(`/contracts/${contractId}/sign`, {
        actor_user_id: userId,
        approve,
        signature: signature.trim(),
      });
      showToast(
        "success",
        approve ? "Contract signed successfully." : "Contract rejected.",
      );
      setSignature("");
      setSelectedContract(null);
      await loadContracts();
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        e.response?.data?.message || e.message || "Signing failed.",
      );
    } finally {
      setSigningId(null);
    }
  };

  const matchLabel = (match: Match) => {
    const f = match.freelancer;
    const name = f
      ? `${f.first_name || ""} ${f.last_name || ""}`.trim() || f.email
      : `#${match.freelancer_user_id}`;
    return `${match.proposal?.title || `Proposal #${match.proposal_id}`} — ${name}`;
  };

  return (
    <>
      <SectionShell
        title="Contracts"
        description={
          role === "company"
            ? "Create AI-generated contract drafts for mutually approved freelancers. Both parties sign digitally."
            : "Review and digitally sign contracts issued by companies you've matched with."
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
            {role === "company" ? "Your Contracts" : "Your Contracts"}
          </h2>

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
              Loading...
            </div>
          ) : contracts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                {role === "company"
                  ? "No contracts yet. Use the + button once a match is mutually approved."
                  : "No contracts yet. They will appear here once a company creates a draft for you."}
              </p>
            </div>
          ) : (
            contracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">
                        Contract #{contract.id}
                      </p>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[contract.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {contract.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Match #{contract.proposal_match_id}
                      {contract.freelancer &&
                        ` · ${`${contract.freelancer.first_name || ""} ${contract.freelancer.last_name || ""}`.trim() || contract.freelancer.email}`}
                    </p>
                  </div>
                  {!["active", "rejected"].includes(contract.status) && (
                    <button
                      className="btn-secondary text-sm"
                      onClick={() =>
                        setSelectedContract(
                          selectedContract?.id === contract.id
                            ? null
                            : contract,
                        )
                      }
                    >
                      {selectedContract?.id === contract.id
                        ? "Close"
                        : "Sign / Review"}
                    </button>
                  )}
                </div>

                <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-40 overflow-auto bg-gray-50 rounded-xl border border-gray-100 p-3 leading-relaxed">
                  {contract.contract_text}
                </div>

                {selectedContract?.id === contract.id && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <p className="text-xs font-medium text-gray-700">
                      Enter your full name as a digital signature:
                    </p>
                    <input
                      className="input"
                      placeholder="Full name"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        className="btn text-sm"
                        disabled={signingId === contract.id}
                        onClick={() => sign(contract.id, true)}
                      >
                        {signingId === contract.id
                          ? "Signing..."
                          : "Sign & Approve"}
                      </button>
                      <button
                        className="btn-secondary text-sm"
                        disabled={signingId === contract.id}
                        onClick={() => sign(contract.id, false)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SectionShell>

      {/* Floating + (company only) */}
      {role === "company" && (
        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95"
          aria-label="New contract"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setForm(EMPTY_FORM);
        }}
        title="Generate Contract Draft"
      >
        {mutualMatches.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            No mutually approved matches yet. Both parties must approve a match
            before a contract can be created.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Match *
              </label>
              <select
                className="input"
                value={form.proposal_match_id}
                onChange={(e) => {
                  const matchId = e.target.value;
                  const match = mutualMatches.find(
                    (m) => String(m.id) === matchId,
                  );
                  setForm({
                    ...form,
                    proposal_match_id: matchId,
                    freelancer_user_id: match
                      ? String(match.freelancer_user_id)
                      : "",
                  });
                }}
              >
                <option value="">Select a mutually approved match</option>
                {mutualMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {matchLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Scope of Work *
              </label>
              <textarea
                className="input min-h-24 resize-none"
                placeholder="Describe deliverables and responsibilities in detail..."
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Payment Terms
                </label>
                <input
                  className="input"
                  placeholder="e.g. $2,000 on delivery"
                  value={form.payment_terms}
                  onChange={(e) =>
                    setForm({ ...form, payment_terms: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Timeline
                </label>
                <input
                  className="input"
                  placeholder="e.g. 4 weeks"
                  value={form.timeline}
                  onChange={(e) =>
                    setForm({ ...form, timeline: e.target.value })
                  }
                />
              </div>
            </div>

            <p className="text-xs text-gray-400">
              The contract text will be generated by Gemini AI based on the
              details above.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                className="btn flex-1 text-sm"
                onClick={createContract}
                disabled={creating}
              >
                {creating ? "Generating..." : "Generate Contract"}
              </button>
              <button
                className="btn-secondary flex-1 text-sm"
                onClick={() => {
                  setModalOpen(false);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
