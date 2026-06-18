"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, Trash2, User, X, Loader2 } from "lucide-react";
import api, { fastApi } from "@/lib/api";

type ChatItem = { role: "user" | "assistant"; content: string };

interface ProposalDraft {
  title: string;
  description: string;
  required_skills: string[];
  budget_min: number | null;
  budget_max: number | null;
  timeline: string;
}

interface FreelancerProfileDraft {
  first_name: string;
  last_name: string;
  headline: string;
  skills: string[];
  hourly_rate: number | null;
  experience_level: string;
  bio: string;
  portfolio_url: string;
  availability: string;
}

interface CompanyProfileDraft {
  contact_first_name: string;
  contact_last_name: string;
  company_name: string;
  company_description: string;
  industry: string;
  company_size: string;
  company_website: string;
}

const PROPOSAL_APPROVAL_KEYWORDS = [
  "yes", "looks good", "approve", "go ahead", "post it", "create it",
  "submit", "publish", "perfect", "sounds good", "do it", "confirmed",
  "ok", "okay", "sure", "proceed",
];

function isProposalApproval(msg: string) {
  const lower = msg.toLowerCase().trim();
  return PROPOSAL_APPROVAL_KEYWORDS.some((kw) => lower.includes(kw));
}

/* ── Proposal Modal ── */
function ProposalModal({ draft, onClose, onPost }: {
  draft: ProposalDraft;
  onClose: () => void;
  onPost: (d: ProposalDraft) => Promise<void>;
}) {
  const [form, setForm] = useState<ProposalDraft>(draft);
  const [posting, setPosting] = useState(false);
  const set = (field: keyof ProposalDraft, value: unknown) =>
    setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Review Job Proposal</h2>
            <p className="text-xs text-gray-400 mt-0.5">Edit if needed, then post</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Job Title</label>
            <input className="input text-sm" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea className="input text-sm resize-none" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Required Skills <span className="text-gray-400">(comma-separated)</span></label>
            <input className="input text-sm" value={form.required_skills.join(", ")}
              onChange={(e) => set("required_skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Min Budget ($)</label>
              <input className="input text-sm" type="number" value={form.budget_min ?? ""}
                onChange={(e) => set("budget_min", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Max Budget ($)</label>
              <input className="input text-sm" type="number" value={form.budget_max ?? ""}
                onChange={(e) => set("budget_max", e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Timeline</label>
            <input className="input text-sm" value={form.timeline} onChange={(e) => set("timeline", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button disabled={posting || !form.title.trim()} onClick={async () => { setPosting(true); await onPost(form); setPosting(false); }}
            className="btn flex-1 text-sm flex items-center justify-center gap-2">
            {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {posting ? "Posting…" : "Post Proposal"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Freelancer Profile Modal ── */
function FreelancerProfileModal({ draft, onClose, onSave }: {
  draft: FreelancerProfileDraft;
  onClose: () => void;
  onSave: (d: FreelancerProfileDraft) => Promise<void>;
}) {
  const [form, setForm] = useState<FreelancerProfileDraft>(draft);
  const [saving, setSaving] = useState(false);
  const set = (field: keyof FreelancerProfileDraft, value: unknown) =>
    setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Update Your Profile</h2>
            <p className="text-xs text-gray-400 mt-0.5">Review AI suggestions and save</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
              <input className="input text-sm" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label>
              <input className="input text-sm" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Professional Headline</label>
            <input className="input text-sm" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Skills <span className="text-gray-400">(comma-separated)</span></label>
            <input className="input text-sm" value={form.skills.join(", ")}
              onChange={(e) => set("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
            <textarea className="input text-sm resize-none" rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hourly Rate ($)</label>
              <input className="input text-sm" type="number" value={form.hourly_rate ?? ""}
                onChange={(e) => set("hourly_rate", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Experience Level</label>
              <select className="input text-sm" value={form.experience_level} onChange={(e) => set("experience_level", e.target.value)}>
                <option value="">Select…</option>
                <option value="entry">Entry</option>
                <option value="intermediate">Intermediate</option>
                <option value="senior">Senior</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Portfolio URL</label>
            <input className="input text-sm" value={form.portfolio_url} onChange={(e) => set("portfolio_url", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Availability</label>
            <select className="input text-sm" value={form.availability} onChange={(e) => set("availability", e.target.value)}>
              <option value="">Select…</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="project-based">Project-based</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button disabled={saving} onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
            className="btn flex-1 text-sm flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Company Profile Modal ── */
function CompanyProfileModal({ draft, onClose, onSave }: {
  draft: CompanyProfileDraft;
  onClose: () => void;
  onSave: (d: CompanyProfileDraft) => Promise<void>;
}) {
  const [form, setForm] = useState<CompanyProfileDraft>(draft);
  const [saving, setSaving] = useState(false);
  const set = (field: keyof CompanyProfileDraft, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Update Company Profile</h2>
            <p className="text-xs text-gray-400 mt-0.5">Review AI suggestions and save</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contact First Name</label>
              <input className="input text-sm" value={form.contact_first_name} onChange={(e) => set("contact_first_name", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contact Last Name</label>
              <input className="input text-sm" value={form.contact_last_name} onChange={(e) => set("contact_last_name", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Company Name</label>
            <input className="input text-sm" value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Company Description</label>
            <textarea className="input text-sm resize-none" rows={4} value={form.company_description}
              onChange={(e) => set("company_description", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Industry</label>
            <input className="input text-sm" value={form.industry} onChange={(e) => set("industry", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Company Size</label>
            <input className="input text-sm" placeholder="e.g. 10-50 employees" value={form.company_size}
              onChange={(e) => set("company_size", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Website</label>
            <input className="input text-sm" value={form.company_website} onChange={(e) => set("company_website", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button disabled={saving} onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
            className="btn flex-1 text-sm flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ── */
function omitEmpty(obj: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
  );
}

/* ── Main page ── */
export default function HomeChatbotPage() {
  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : "freelancer";
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const [mode, setMode] = useState<"proposal" | "profile" | null>(null);

  const endpoint = useMemo(() => {
    if (mode === "proposal") return "/company-chat/chat";
    if (mode === "profile") return userRole === "company" ? "/company-chat/chat" : "/freelancer-chat/chat";
    return userRole === "company" ? "/company-chat/chat" : "/freelancer-chat/chat";
  }, [mode, userRole]);

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);

  const [proposalDraft, setProposalDraft] = useState<ProposalDraft | null>(null);
  const [freelancerProfileDraft, setFreelancerProfileDraft] = useState<FreelancerProfileDraft | null>(null);
  const [companyProfileDraft, setCompanyProfileDraft] = useState<CompanyProfileDraft | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/chat/history")
      .then((res) => {
        const msgs: ChatItem[] = (res.data.messages ?? []).map(
          (m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content }),
        );
        setChat(msgs);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const triggerExtract = async (history: ChatItem[]) => {
    setExtracting(true);
    try {
      if (mode === "proposal") {
        const res = await fastApi.post("/company-chat/extract-proposal", { chat_history: history });
        if (res.data.success) {
          setProposalDraft({
            title: res.data.title,
            description: res.data.description,
            required_skills: res.data.required_skills,
            budget_min: res.data.budget_min,
            budget_max: res.data.budget_max,
            timeline: res.data.timeline ?? "",
          });
        }
      } else if (mode === "profile") {
        if (userRole === "company") {
          const res = await fastApi.post("/company-chat/extract-profile", { chat_history: history });
          setCompanyProfileDraft({
            contact_first_name: res.data.contact_first_name ?? "",
            contact_last_name: res.data.contact_last_name ?? "",
            company_name: res.data.company_name ?? "",
            company_description: res.data.company_description ?? "",
            industry: res.data.industry ?? "",
            company_size: res.data.company_size ?? "",
            company_website: res.data.company_website ?? "",
          });
        } else {
          const res = await fastApi.post("/freelancer-chat/extract-profile", { chat_history: history });
          setFreelancerProfileDraft({
            first_name: res.data.first_name ?? "",
            last_name: res.data.last_name ?? "",
            headline: res.data.headline ?? "",
            skills: res.data.skills ?? [],
            hourly_rate: res.data.hourly_rate ?? null,
            experience_level: res.data.experience_level ?? "",
            bio: res.data.bio ?? "",
            portfolio_url: res.data.portfolio_url ?? "",
            availability: res.data.availability ?? "",
          });
        }
      }
    } catch { /* silent */ }
    finally { setExtracting(false); }
  };

  const send = async () => {
    if (!message.trim() || loading) return;
    const msg = message.trim();
    setMessage("");
    const updated: ChatItem[] = [...chat, { role: "user", content: msg }];
    setChat(updated);
    setLoading(true);

    try {
      const response = await fastApi.post(endpoint, {
        message: msg,
        chat_history: updated,
        ...(mode ? { mode } : {}),
      });

      const assistantReply: string = response.data.response || "No response";
      // Strip the internal tag before displaying
      const displayReply = assistantReply.replace("[PROFILE_READY]", "").trim();
      const final: ChatItem[] = [...updated, { role: "assistant", content: displayReply }];
      setChat(final);
      api.post("/chat/history", { messages: final.slice(-2) }).catch(() => {});

      // Proposal: trigger on user approval
      if (mode === "proposal" && isProposalApproval(msg) && final.length >= 4) {
        triggerExtract(final);
      }

      // Profile: trigger only when AI signals [PROFILE_READY] in its response
      if (mode === "profile" && assistantReply.includes("[PROFILE_READY]")) {
        triggerExtract(final);
      }
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm unavailable right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handlePostProposal = async (draft: ProposalDraft) => {
    await api.post("/proposals", omitEmpty({
      actor_user_id: Number(userId),
      company_user_id: Number(userId),
      title: draft.title,
      description: draft.description,
      required_skills: draft.required_skills,
      budget_min: draft.budget_min,
      budget_max: draft.budget_max,
      timeline: draft.timeline,
      status: "open",
    }));
    setProposalDraft(null);
    setChat((prev) => [...prev, {
      role: "assistant",
      content: `✅ Your proposal "${draft.title}" has been posted! You can view it under Job Proposals.`,
    }]);
  };

  const handleSaveFreelancerProfile = async (draft: FreelancerProfileDraft) => {
    // Update name fields on the user record
    const namePayload = omitEmpty({ first_name: draft.first_name, last_name: draft.last_name });
    if (Object.keys(namePayload).length) {
      await api.put(`/users/${userId}`, namePayload);
    }
    // Update extended profile fields
    const profilePayload = omitEmpty({
      actor_user_id: Number(userId),
      user_id: Number(userId),
      headline: draft.headline,
      skills: draft.skills,
      hourly_rate: draft.hourly_rate,
      experience_level: draft.experience_level,
      bio: draft.bio,
      portfolio_url: draft.portfolio_url,
      availability: draft.availability,
    });
    await api.post("/freelancer-profile", profilePayload);
    setFreelancerProfileDraft(null);
    setChat((prev) => [...prev, {
      role: "assistant",
      content: "✅ Your profile has been updated successfully! Head to your Profile page to see the changes.",
    }]);
  };

  const handleSaveCompanyProfile = async (draft: CompanyProfileDraft) => {
    await api.put(`/users/${userId}`, omitEmpty({
      contact_first_name: draft.contact_first_name,
      contact_last_name: draft.contact_last_name,
      company_name: draft.company_name,
      company_description: draft.company_description,
      industry: draft.industry,
      company_size: draft.company_size,
      company_website: draft.company_website,
    }));
    setCompanyProfileDraft(null);
    setChat((prev) => [...prev, {
      role: "assistant",
      content: "✅ Your company profile has been updated successfully! Head to your Profile page to see the changes.",
    }]);
  };

  const clearHistory = async () => {
    await api.delete("/chat/history").catch(() => {});
    setChat([]);
    setMode(null);
  };

  return (
    <>
      {proposalDraft && (
        <ProposalModal draft={proposalDraft} onClose={() => setProposalDraft(null)} onPost={handlePostProposal} />
      )}
      {freelancerProfileDraft && (
        <FreelancerProfileModal draft={freelancerProfileDraft} onClose={() => setFreelancerProfileDraft(null)} onSave={handleSaveFreelancerProfile} />
      )}
      {companyProfileDraft && (
        <CompanyProfileModal draft={companyProfileDraft} onClose={() => setCompanyProfileDraft(null)} onSave={handleSaveCompanyProfile} />
      )}

      <div className="flex flex-col h-[calc(100vh-2rem)] p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-base leading-tight">AI Assistant</h1>
              <p className="text-xs text-gray-400">Job proposal helper / Profile enhancer</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {extracting && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing…
              </span>
            )}
            <button onClick={clearHistory} title="Clear history"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-4">
          {historyLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.15s]" />
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.3s]" />
            </div>
          ) : chat.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-16">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <Bot className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-base">What would you like to do?</p>
                <p className="text-xs text-gray-400 mt-1">Choose an option to get started</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {userRole === "company" && (
                  <button
                    onClick={() => {
                      setMode("proposal");
                      setChat([{ role: "assistant", content: "Great! Let's craft a compelling job proposal. What kind of role or project are you looking to post?" }]);
                    }}
                    className="px-5 py-3 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all text-sm font-medium text-red-700 text-left"
                  >
                    📋 Help me write a job proposal
                  </button>
                )}
                <button
                  onClick={() => {
                    setMode("profile");
                    setChat([{ role: "assistant", content: "Sure! I'll help you enhance your profile. Let's go through each field one at a time.\n\nFirst — what is your first name and last name?" }]);
                  }}
                  className="px-5 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all text-sm font-medium text-gray-700 text-left"
                >
                  ✨ Enhance my profile
                </button>
              </div>
            </div>
          ) : (
            chat.map((item, idx) => (
              <div key={idx} className={`flex items-end gap-2 ${item.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${item.role === "user" ? "bg-red-600" : "bg-gray-700"}`}>
                  {item.role === "user" ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed
                  ${item.role === "user" ? "bg-red-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"}`}>
                  {item.content}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-3 flex gap-2 items-center bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400/30 transition-all">
          <input
            ref={inputRef}
            className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-400"
            placeholder={mode ? "Type your message…" : "Choose an option above to start"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) send(); }}
            disabled={loading || !mode}
          />
          <button onClick={send} disabled={loading || !message.trim() || !mode}
            className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0">
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </>
  );
}
