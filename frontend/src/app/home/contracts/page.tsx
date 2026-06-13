"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Plus, FileText, ListChecks, Pencil, X, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
import Modal from "@/components/protected/Modal";
import { useRouter } from "next/navigation";

type Contract = {
  id: number;
  status: string;
  contract_text: string;
  proposal_match_id: number;
  company_user_id: number;
  freelancer_user_id: number;
  employer_signature?: string | null;
  freelancer_signature?: string | null;
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
  draft:             "bg-gray-100 text-gray-500",
  company_signed:    "bg-blue-50 text-blue-700",
  freelancer_signed: "bg-amber-50 text-amber-700",
  active:            "bg-emerald-50 text-emerald-700",
  rejected:          "bg-red-50 text-red-600",
  completed:         "bg-emerald-100 text-emerald-800",
};

const STATUS_LABEL: Record<string, string> = {
  draft:             "Draft — Awaiting Company Signature",
  company_signed:    "Company Signed — Awaiting Freelancer",
  freelancer_signed: "Freelancer Signed — Awaiting Company",
  active:            "Active",
  rejected:          "Rejected",
  completed:         "Completed ✓",
};

/* ─── Signature Canvas ────────────────────────────────────────── */
function SignatureCanvas({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const drawing = useRef(false);
  const lastPos  = useRef({ x: 0, y: 0 });

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return;
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
    e.preventDefault();
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvasRef.current);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    e.preventDefault();
  };

  const stop = () => { drawing.current = false; };

  const clear = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border-2 border-gray-200 bg-white overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef as React.RefObject<HTMLCanvasElement>}
          width={560}
          height={160}
          className="w-full touch-none"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={stop}
        />
        <div className="absolute bottom-4 left-4 right-4 border-t border-gray-300 pointer-events-none" />
      </div>
      <button
        type="button"
        onClick={clear}
        className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 transition"
      >
        Clear signature
      </button>
    </div>
  );
}

/* ─── Signature Modal ─────────────────────────────────────────── */
type SigForm = { firstName: string; lastName: string; title: string; date: string };

function SignatureModal({
  onClose,
  onConfirm,
  submitting,
}: {
  onClose: () => void;
  onConfirm: (form: SigForm, dataUrl: string) => void;
  submitting: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<SigForm>({ firstName: "", lastName: "", title: "", date: today });

  const handleConfirm = () => {
    if (!form.firstName || !form.lastName) { alert("First and last name are required."); return; }
    const canvas = canvasRef.current;
    const isEmpty = !canvas || !canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data.some(v => v !== 0);
    if (isEmpty) { alert("Please draw your signature."); return; }
    onConfirm(form, canvas!.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Sign Contract</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your signature will be permanently recorded on the contract.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
              <input className="input text-sm" placeholder="e.g. John" value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
              <input className="input text-sm" placeholder="e.g. Smith" value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>

          {/* Title + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Title / Role</label>
              <input className="input text-sm" placeholder="e.g. CEO, Freelancer" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
              <input className="input text-sm" type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>

          {/* Canvas */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Signature *</label>
            <p className="text-xs text-gray-400 mb-2">Draw your signature in the box below.</p>
            <SignatureCanvas canvasRef={canvasRef} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="btn flex-1 text-sm"
            >
              {submitting ? "Signing…" : "Confirm & Sign"}
            </button>
            <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Contract Document Renderer ─────────────────────────────── */
function renderLine(line: string, i: number): React.ReactNode {
  const bold = (s: string) =>
    s.split(/\*\*(.*?)\*\*/g).map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
    );

  const trimmed = line.trim();

  // Empty line → spacer
  if (!trimmed) return <div key={i} className="h-3" />;

  // Section headings: "**1. TITLE**" or "**SECTION:**" patterns
  if (/^\*\*[A-Z0-9][^*]*\*\*$/.test(trimmed)) {
    const text = trimmed.replace(/\*\*/g, "");
    return (
      <h3 key={i} className="text-sm font-bold text-gray-900 mt-5 mb-1 uppercase tracking-wide border-b border-gray-200 pb-1">
        {text}
      </h3>
    );
  }

  // Lines that start with a number + dot (article lines)
  if (/^\d+\./.test(trimmed)) {
    return <p key={i} className="text-sm text-gray-800 leading-relaxed font-semibold mt-3">{bold(trimmed)}</p>;
  }

  // Lines with * bullet
  if (trimmed.startsWith("*") && !trimmed.startsWith("**")) {
    return <p key={i} className="text-sm text-gray-700 leading-relaxed pl-4 before:content-['•'] before:mr-2">{bold(trimmed.replace(/^\*\s*/, ""))}</p>;
  }

  // Signature placeholder lines (dashes/underscores)
  if (/^[*\s]*[A-Za-z ]+:\s*[_\-]{5,}/.test(trimmed)) {
    return <p key={i} className="text-sm text-gray-500 leading-loose font-mono">{bold(trimmed)}</p>;
  }

  // Default body line
  return <p key={i} className="text-sm text-gray-700 leading-relaxed">{bold(trimmed)}</p>;
}

function ContractDocument({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-inner mx-1 px-8 py-7 max-h-[480px] overflow-y-auto">
      {/* Decorative top rule */}
      <div className="border-t-4 border-red-600 mb-6" />
      <div className="space-y-0.5">
        {lines.map((line, i) => renderLine(line, i))}
      </div>
      <div className="border-b-2 border-gray-300 mt-8" />
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
const EMPTY_FORM = { proposal_match_id: "", freelancer_user_id: "", scope: "", payment_terms: "", timeline: "" };

export default function HomeContractsPage() {
  const router = useRouter();
  const role   = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const userId = typeof window !== "undefined" ? Number(localStorage.getItem("userId") || 0) : 0;

  const [contracts,     setContracts]     = useState<Contract[]>([]);
  const [mutualMatches, setMutualMatches] = useState<Match[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [creating,      setCreating]      = useState(false);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [toast,         setToast]         = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Signing
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const [signingSubmit,   setSigningSubmit]   = useState(false);

  // Editing (company only)
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [editText,        setEditText]        = useState("");
  const [editSaving,      setEditSaving]      = useState(false);

  // Collapsible
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggleCollapse = (id: number) =>
    setCollapsed(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // Finalize
  const [finalizeTarget,  setFinalizeTarget]  = useState<Contract | null>(null);
  const [paymentNotes,    setPaymentNotes]    = useState("");
  const [finalizing,      setFinalizing]      = useState(false);

  const finalizeContract = async () => {
    if (!finalizeTarget) return;
    setFinalizing(true);
    try {
      await api.post(`/contracts/${finalizeTarget.id}/finalize`, {
        actor_user_id: userId,
        payment_notes: paymentNotes || undefined,
        confirmed: true,
      });
      showToast("success", "Contract finalized and marked as completed!");
      setFinalizeTarget(null);
      setPaymentNotes("");
      await loadContracts();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Finalization failed.");
    } finally {
      setFinalizing(false);
    }
  };

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadContracts = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get("/contracts", { params: { actor_user_id: userId } });
      setContracts(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMutualMatches = useCallback(async () => {
    if (!userId || role !== "company") return;
    const res = await api.get("/matches", { params: { actor_user_id: userId } });
    setMutualMatches((res.data || []).filter((m: Match) => m.status === "mutual_approved"));
  }, [userId, role]);

  useEffect(() => { loadContracts(); loadMutualMatches(); }, [loadContracts, loadMutualMatches]);

  const createContract = async () => {
    if (!form.proposal_match_id || !form.scope.trim()) {
      showToast("error", "Please select a match and describe the scope of work.");
      return;
    }
    setCreating(true);
    try {
      await api.post("/contracts", {
        actor_user_id: userId,
        company_user_id: userId,
        proposal_match_id: Number(form.proposal_match_id),
        freelancer_user_id: Number(form.freelancer_user_id),
        details: { scope: form.scope, payment_terms: form.payment_terms, timeline: form.timeline },
      });
      setForm(EMPTY_FORM);
      setModalOpen(false);
      showToast("success", "Contract draft created.");
      await loadContracts();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Contract creation failed.");
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async () => {
    if (!editingContract) return;
    setEditSaving(true);
    try {
      await api.put(`/contracts/${editingContract.id}`, { actor_user_id: userId, contract_text: editText });
      showToast("success", "Contract updated.");
      setEditingContract(null);
      await loadContracts();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Update failed.");
    } finally {
      setEditSaving(false);
    }
  };

  const signContract = async (contract: Contract, sigForm: SigForm, dataUrl: string) => {
    setSigningSubmit(true);
    const signaturePayload = JSON.stringify({
      name: `${sigForm.firstName} ${sigForm.lastName}`,
      title: sigForm.title,
      date: sigForm.date,
      image: dataUrl,
    });
    try {
      await api.post(`/contracts/${contract.id}/sign`, {
        actor_user_id: userId,
        approve: true,
        signature: signaturePayload,
      });
      showToast("success", "Contract signed successfully.");
      setSigningContract(null);
      await loadContracts();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Signing failed.");
    } finally {
      setSigningSubmit(false);
    }
  };

  const rejectContract = async (contractId: number) => {
    try {
      await api.post(`/contracts/${contractId}/sign`, { actor_user_id: userId, approve: false, signature: "rejected" });
      showToast("success", "Contract rejected.");
      await loadContracts();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Rejection failed.");
    }
  };

  const matchLabel = (m: Match) => {
    const f = m.freelancer;
    const name = f ? `${f.first_name || ""} ${f.last_name || ""}`.trim() || f.email : `#${m.freelancer_user_id}`;
    return `${m.proposal?.title || `Proposal #${m.proposal_id}`} — ${name}`;
  };

  const parseSignature = (raw?: string | null) => {
    if (!raw) return null;
    try { return JSON.parse(raw) as { name: string; title: string; date: string; image: string }; }
    catch { return null; }
  };

  const canSign = (c: Contract) => {
    if (role === "company"    && c.status === "draft")            return true;
    if (role === "company"    && c.status === "freelancer_signed") return true;
    if (role === "freelancer" && c.status === "company_signed")   return true;
    return false;
  };

  return (
    <>
      <SectionShell
        title="Contracts"
        description={
          role === "company"
            ? "Create, edit, and sign AI-generated contracts. Both parties must sign to activate."
            : "Review and digitally sign contracts issued by companies you've matched with."
        }
      >
        {toast && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${toast.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {toast.text}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : contracts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              {role === "company"
                ? "No contracts yet. Use the + button once a match is mutually approved."
                : "No contracts yet. They appear here once a company creates a draft for you."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
          {(["ongoing", "completed"] as const).map(group => {
            const items = group === "ongoing"
              ? contracts.filter(c => !["completed","rejected"].includes(c.status))
              : contracts.filter(c => ["completed","rejected"].includes(c.status));
            if (items.length === 0) return null;
            return (
              <div key={group} className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${group === "ongoing" ? "bg-amber-400" : "bg-emerald-500"}`} />
                  {group === "ongoing" ? "Ongoing" : "Completed"} ({items.length})
                </h2>
                {items.map(contract => {
              const companySig    = parseSignature(contract.employer_signature);
              const freelancerSig = parseSignature(contract.freelancer_signature);
              const isCollapsed   = collapsed.has(contract.id);

              const otherParty = role === "company"
                ? (contract.freelancer ? `${contract.freelancer.first_name || ""} ${contract.freelancer.last_name || ""}`.trim() || contract.freelancer.email : null)
                : (contract.company?.company_name?.trim() || contract.company?.contact_first_name || null);

              const contractTitle = otherParty ? `Contract with ${otherParty}` : `Contract #${contract.id}`;

              return (
                <div key={contract.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${contract.status === "completed" ? "border-emerald-200" : "border-gray-200"}`}>
                  {/* Header — always visible */}
                  <div
                    className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => toggleCollapse(contract.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-900">{contractTitle}</p>
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLE[contract.status] || "bg-gray-100 text-gray-500"}`}>
                            {STATUS_LABEL[contract.status] || contract.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {contract.status === "active" && (
                        <>
                          <button className="btn text-sm flex items-center gap-1.5" onClick={() => router.push("/home/tasks")}>
                            <ListChecks className="w-4 h-4" /> Tasks
                          </button>
                          <button
                            className="btn text-sm flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => { setFinalizeTarget(contract); setPaymentNotes(""); }}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Finalize
                          </button>
                        </>
                      )}
                      {contract.status === "completed" && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Project Completed
                        </span>
                      )}
                      {role === "company" && contract.status === "draft" && (
                        <button className="btn-secondary text-sm flex items-center gap-1.5"
                          onClick={() => { setEditingContract(contract); setEditText(contract.contract_text); }}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      {canSign(contract) && (
                        <button className="btn text-sm" onClick={() => setSigningContract(contract)}>Sign & Approve</button>
                      )}
                      {canSign(contract) && (
                        <button className="btn-secondary text-sm text-red-600" onClick={() => rejectContract(contract.id)}>Reject</button>
                      )}
                      <button
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"
                        onClick={() => toggleCollapse(contract.id)}
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible body */}
                  {!isCollapsed && (
                    <>
                      {/* Contract document */}
                      <div className="px-5 pb-4">
                        <ContractDocument text={contract.contract_text} />
                      </div>

                      {/* Signature execution block */}
                      {(companySig || freelancerSig) && (
                        <div className="mx-5 mb-5 rounded-xl border border-gray-200 overflow-hidden">
                          <div className="bg-gray-50 px-5 py-2 border-b border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Executed by the Parties</p>
                          </div>
                          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                            <div className="p-5">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Client / Company</p>
                              {companySig ? (
                                <>
                                  <img src={companySig.image} alt="Company signature" className="h-16 w-auto mb-3" />
                                  <div className="border-t-2 border-gray-800 pt-2 space-y-0.5">
                                    <p className="text-sm font-bold text-gray-900">{companySig.name}</p>
                                    {companySig.title && <p className="text-xs text-gray-500">{companySig.title}</p>}
                                    <p className="text-xs text-gray-400">Date: {companySig.date}</p>
                                  </div>
                                </>
                              ) : <div className="h-16 border-b border-dashed border-gray-300 mb-2" />}
                            </div>
                            <div className="p-5">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Service Provider / Freelancer</p>
                              {freelancerSig ? (
                                <>
                                  <img src={freelancerSig.image} alt="Freelancer signature" className="h-16 w-auto mb-3" />
                                  <div className="border-t-2 border-gray-800 pt-2 space-y-0.5">
                                    <p className="text-sm font-bold text-gray-900">{freelancerSig.name}</p>
                                    {freelancerSig.title && <p className="text-xs text-gray-500">{freelancerSig.title}</p>}
                                    <p className="text-xs text-gray-400">Date: {freelancerSig.date}</p>
                                  </div>
                                </>
                              ) : (
                                <div className="h-16 border-b border-dashed border-gray-300 mb-2 flex items-end pb-1">
                                  <p className="text-xs text-gray-300 italic">Awaiting signature…</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      </div>
    )}
      </SectionShell>

      {/* Create contract button (company only) */}
      {role === "company" && (
        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95"
          aria-label="New contract"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Signature modal */}
      {signingContract && (
        <SignatureModal
          onClose={() => setSigningContract(null)}
          onConfirm={(form, dataUrl) => signContract(signingContract, form, dataUrl)}
          submitting={signingSubmit}
        />
      )}

      {/* Finalize contract modal */}
      <Modal isOpen={!!finalizeTarget} onClose={() => setFinalizeTarget(null)} title="Finalize Contract">
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            This will mark the project as <strong>completed</strong>. Both parties confirm the work has been delivered and payment has been settled.
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment & Completion Notes (optional)</label>
            <textarea
              className="input text-sm resize-none min-h-[80px]"
              placeholder="e.g. Full payment of $1,200 received on Jun 13. All deliverables approved."
              value={paymentNotes}
              onChange={e => setPaymentNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              className="btn flex-1 text-sm flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              onClick={finalizeContract}
              disabled={finalizing}
            >
              <CheckCircle2 className="w-4 h-4" />
              {finalizing ? "Finalizing…" : "Confirm & Finalize"}
            </button>
            <button className="btn-secondary flex-1 text-sm" onClick={() => setFinalizeTarget(null)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Edit contract modal (company) */}
      <Modal isOpen={!!editingContract} onClose={() => setEditingContract(null)} title="Edit Contract">
        <div className="space-y-4">
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Edit the contract text before signing. Once signed it cannot be changed.
          </p>
          <textarea
            className="input min-h-64 resize-y text-sm font-mono leading-relaxed"
            value={editText}
            onChange={e => setEditText(e.target.value)}
          />
          <div className="flex gap-3">
            <button className="btn flex-1 text-sm" onClick={saveEdit} disabled={editSaving}>
              {editSaving ? "Saving…" : "Save Changes"}
            </button>
            <button className="btn-secondary flex-1 text-sm" onClick={() => setEditingContract(null)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Create contract modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setForm(EMPTY_FORM); }} title="Generate Contract Draft">
        {mutualMatches.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            No mutually approved matches yet.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Match *</label>
              <select className="input" value={form.proposal_match_id}
                onChange={e => {
                  const matchId = e.target.value;
                  const match = mutualMatches.find(m => String(m.id) === matchId);
                  setForm({ ...form, proposal_match_id: matchId, freelancer_user_id: match ? String(match.freelancer_user_id) : "" });
                }}
              >
                <option value="">Select a mutually approved match</option>
                {mutualMatches.map(m => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Scope of Work *</label>
              <textarea className="input min-h-24 resize-none" placeholder="Describe deliverables and responsibilities…"
                value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Terms</label>
                <input className="input" placeholder="e.g. $2,000 on delivery" value={form.payment_terms}
                  onChange={e => setForm({ ...form, payment_terms: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Timeline</label>
                <input className="input" placeholder="e.g. 4 weeks" value={form.timeline}
                  onChange={e => setForm({ ...form, timeline: e.target.value })} />
              </div>
            </div>
            <p className="text-xs text-gray-400">AI will generate the contract text from the details above.</p>
            <div className="flex gap-3 pt-1">
              <button className="btn flex-1 text-sm" onClick={createContract} disabled={creating}>
                {creating ? "Generating…" : "Generate Contract"}
              </button>
              <button className="btn-secondary flex-1 text-sm" onClick={() => { setModalOpen(false); setForm(EMPTY_FORM); }}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
