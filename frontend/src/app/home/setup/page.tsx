"use client";

import { useEffect, useRef, useState } from "react";

import {
  CheckCircle2,
  Send,
  Bot,
  AlertTriangle,
  Paperclip,
} from "lucide-react";
import api, { fastApi } from "@/lib/api";
import { setCachedValue } from "@/lib/localCache";

type Msg = { role: "user" | "assistant"; content: string };

/* ---------- extra questions for Google users (missing from signup) ---------- */
const GOOGLE_EXTRA_QUESTIONS = [
  { key: "phone_number", label: "Phone Number", hint: "e.g. +1 555 123 4567" },
  { key: "freelance_category", label: "Freelance Category", hint: "e.g. Web Development, Design, Writing" },
];

/* ---------- role-specific questions ---------- */
const FREELANCER_QUESTIONS = [
  {
    key: "headline",
    label: "Professional Headline",
    hint: "e.g. Senior React Developer",
  },
  {
    key: "skills",
    label: "Top Skills",
    hint: "e.g. React, TypeScript, Node.js",
  },
  {
    key: "experience_level",
    label: "Experience Level",
    hint: "entry / intermediate / senior / expert",
  },
  { key: "hourly_rate", label: "Hourly Rate (USD)", hint: "e.g. 45" },
  { key: "bio", label: "Professional Bio", hint: "2–3 sentences about you" },
  {
    key: "portfolio_url",
    label: "Portfolio / GitHub URL",
    hint: "https://... or skip",
  },
  {
    key: "availability",
    label: "Availability",
    hint: "full-time / part-time / project-based",
  },
];

const COMPANY_QUESTIONS = [
  {
    key: "company_name",
    label: "Company Name",
    hint: "Your company's full name",
  },
  { key: "industry", label: "Industry", hint: "e.g. Technology, Healthcare" },
  {
    key: "contact_first_name",
    label: "Your First Name",
    hint: "Primary contact",
  },
  {
    key: "contact_last_name",
    label: "Your Last Name",
    hint: "Primary contact",
  },
  {
    key: "company_description",
    label: "Company Description",
    hint: "2–3 sentences about what you do",
  },
  { key: "phone_number", label: "Phone Number", hint: "Optional" },
];

function toTitleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseAnswer(key: string, raw: string): string {
  const text = raw.trim();

  if (key === "hourly_rate") {
    // Handle ranges like "20 to 30" or "$20-$30" → take the average
    const nums = [...text.matchAll(/\d+(\.\d+)?/g)].map((m) => parseFloat(m[0]));
    if (nums.length >= 2) return String(Math.round((nums[0] + nums[1]) / 2));
    if (nums.length === 1) return String(nums[0]);
    return text;
  }

  if (key === "portfolio_url") {
    if (/^(skip|n\/a|none|no)$/i.test(text)) return "";
    return text;
  }

  if (key === "headline") {
    // Strip "I am a/an", "Im a/an", "I'm a/an", "My headline is" prefixes
    const cleaned = text
      .replace(/^(my (?:headline|title) is\s*)/i, "")
      .replace(/^(i(?:'?m| am) (?:a|an)?\s*)/i, "")
      .replace(/^(working as (?:a|an)?\s*)/i, "")
      .trim();
    return toTitleCase(cleaned);
  }

  if (key === "skills") {
    return text
      .split(/,|\band\b/i)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");
  }

  if (key === "experience_level") {
    const lower = text.toLowerCase();
    if (lower.includes("entry") || lower.includes("junior") || lower.includes("beginner")) return "entry";
    if (lower.includes("intermediate") || lower.includes("mid-level") || lower.includes("mid level")) return "intermediate";
    if (lower.includes("senior") || lower.includes("sr.")) return "senior";
    if (lower.includes("expert") || lower.includes("lead") || lower.includes("principal")) return "expert";
    // single word match
    if (/^(entry|intermediate|senior|expert)$/i.test(text)) return text.toLowerCase();
  }

  if (key === "availability") {
    const lower = text.toLowerCase();
    if (lower.includes("full")) return "full-time";
    if (lower.includes("part")) return "part-time";
    if (lower.includes("project") || lower.includes("contract") || lower.includes("freelance")) return "project-based";
    if (/^(full-time|part-time|project-based)$/i.test(text)) return text.toLowerCase();
  }

  return text;
}

export default function SetupPage() {

  const role = (
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null
  ) as "freelancer" | "company" | null;
  const userId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("userId") || 0)
      : 0;

  const isGoogleUser = typeof window !== "undefined" && localStorage.getItem("googleAuth") === "true";
  const questions =
    role === "company"
      ? COMPANY_QUESTIONS
      : isGoogleUser
      ? [...FREELANCER_QUESTIONS, ...GOOGLE_EXTRA_QUESTIONS]
      : FREELANCER_QUESTIONS;
  const totalSteps = questions.length;

  /* ---- state ---- */
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [allAnswered, setAllAnswered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ value: string; nextIdx: number; finished: boolean } | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUploaded, setCvUploaded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ---- scroll to bottom on new messages ---- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---- probe AI availability and fire first question ---- */
  useEffect(() => {
    const endpoint =
      role === "company" ? "/company-chat/health" : "/freelancer-chat/health";
    fastApi
      .get(endpoint)
      .then((r) => setAiAvailable(!!r.data?.available))
      .catch(() => setAiAvailable(false));

    const welcome =
      role === "company"
        ? "Welcome! I'll guide you through setting up your employer profile with a few quick questions.\n\nLet's start — what is your **company name**?"
        : "Welcome! I'll help you build a strong freelancer profile step by step.\n\nLet's start — what is your **professional headline**? (e.g. *Senior React Developer*)";

    setMessages([{ role: "assistant", content: welcome }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- confirm a pending answer (Yes button) ---- */
  const confirmAnswer = () => {
    if (!pendingConfirm) return;
    const { value, nextIdx, finished } = pendingConfirm;
    const q = questions[currentQ];
    setFormValues((prev) => ({ ...prev, [q.key]: value }));
    setPendingConfirm(null);
    if (finished) setAllAnswered(true);
    else setCurrentQ(nextIdx);
  };

  /* ---- edit — dismiss confirmation, restore input ---- */
  const editAnswer = () => {
    if (!pendingConfirm) return;
    setPendingConfirm(null);
    setInput("");
  };

  /* ---- extract clean value from AI reply ---- */
  const extractFromAIReply = (key: string, aiReply: string, fallback: string): string => {
    if (key === "skills") {
      const m = aiReply.match(/(?:skills (?:are|include)[:\s]+|top skills[:\s]+)([\w\s,./+#-]+?)(?:\.|$)/i);
      if (m) return m[1].split(",").map((s) => s.trim()).filter(Boolean).join(", ");
    }
    if (key === "headline") {
      const m = aiReply.match(/"([^"]{3,60})"/);
      if (m) return toTitleCase(m[1]);
    }
    if (key === "experience_level") {
      const lower = aiReply.toLowerCase();
      if (lower.includes("entry")) return "entry";
      if (lower.includes("intermediate")) return "intermediate";
      if (lower.includes("senior")) return "senior";
      if (lower.includes("expert")) return "expert";
    }
    if (key === "availability") {
      const lower = aiReply.toLowerCase();
      if (lower.includes("full-time") || lower.includes("full time")) return "full-time";
      if (lower.includes("part-time") || lower.includes("part time")) return "part-time";
      if (lower.includes("project")) return "project-based";
    }
    return fallback;
  };

  /* ---- send a message ---- */
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || pendingConfirm) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);

    const q = questions[currentQ];
    if (!q) return;

    const nextIdx = currentQ + 1;
    const finished = nextIdx >= totalSteps;

    const rawParsed = parseAnswer(q.key, text);
    const isGoogleExtra = GOOGLE_EXTRA_QUESTIONS.some((gq) => gq.key === q.key);

    let confirmed = rawParsed;

    if (isGoogleExtra) {
      // Static fields — no AI, just confirm raw value
      setFormValues((prev) => ({ ...prev, [q.key]: rawParsed }));
      setPendingConfirm({ value: rawParsed, nextIdx, finished });
    } else {
      // Call AI to interpret answer, then confirm
      const aiReply = await fetchAIReply(text, updatedHistory, finished);
      setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
      confirmed = extractFromAIReply(q.key, aiReply, rawParsed);
      setFormValues((prev) => ({ ...prev, [q.key]: confirmed }));
      setPendingConfirm({ value: confirmed, nextIdx, finished });
    }
  };

  const fetchAIReply = async (
    userText: string,
    history: Msg[],
    finished: boolean,
  ): Promise<string> => {
    try {
      const endpoint =
        role === "company" ? "/company-chat/chat" : "/freelancer-chat/chat";
      const res = await fastApi.post(endpoint, {
        message: userText,
        chat_history: history,
        ...(role === "company" && { mode: "profile" }),
      });
      const reply: string = res.data?.response || "";
      if (reply) return reply;
    } catch {
      /* fall through */
    }

    // Static fallback
    const nextQ = questions[currentQ + 1];
    if (finished) {
      return "All done! Your profile is ready. Review the details on the right and click **Complete Setup** to continue.";
    }
    if (nextQ) {
      return `Got it! Here's the next question:\n\n**${nextQ.label}** — ${nextQ.hint}`;
    }
    return "Great answer! Keep filling in the form on the right.";
  };

  const uploadCv = async (file: File) => {
    setCvFile(file);
    setCvUploading(true);
    try {
      const fd = new FormData();
      fd.append("cv", file);
      await api.post(`/users/${userId}/cv`, fd);
      setCvUploaded(true);
    } catch {
      setCvFile(null);
    } finally {
      setCvUploading(false);
    }
  };

  /* ---- complete setup ---- */
  const completeSetup = async () => {
    setError("");
    setSaving(true);
    try {
      if (role === "company") {
        const res = await api.put(`/users/${userId}`, {
          company_name: formValues.company_name || "",
          contact_first_name: formValues.contact_first_name || "",
          contact_last_name: formValues.contact_last_name || "",
          industry: formValues.industry || "",
          company_description: formValues.company_description || "",
          phone_number: formValues.phone_number || "",
        });
        setCachedValue(`user:profile:${userId}`, res.data?.user || {});
      } else {
        // Use AI extraction when available to clean up raw answers
        let extracted: Record<string, unknown> = {};
        if (aiAvailable) {
          try {
            const extractRes = await fastApi.post("/freelancer-chat/extract-profile", {
              chat_history: messages,
            });
            extracted = extractRes.data || {};
          } catch {
            /* fall through to raw formValues */
          }
        }

        const rawSkills = (formValues.skills || "")
          .split(/,|\band\b/i)
          .map((s) => s.trim())
          .filter(Boolean);

        await api.post("/freelancer-profile", {
          actor_user_id: userId,
          user_id: userId,
          headline: (extracted.headline as string) || formValues.headline || "",
          skills: (extracted.skills as string[])?.length
            ? (extracted.skills as string[])
            : rawSkills,
          hourly_rate: (extracted.hourly_rate as number) ?? (formValues.hourly_rate ? Number(formValues.hourly_rate) : null),
          experience_level: (extracted.experience_level as string) || formValues.experience_level || "",
          bio: (extracted.bio as string) || formValues.bio || "",
          portfolio_url: (extracted.portfolio_url as string) || formValues.portfolio_url || null,
          availability: (extracted.availability as string) || formValues.availability || "",
        });
        setCachedValue(`user:profile:${userId}`, {
          email: localStorage.getItem("userEmail") || "",
          ...formValues,
        });
      }

      // For Google users, patch the missing signup fields back to the user record
      if (isGoogleUser && (formValues.phone_number || formValues.freelance_category)) {
        await api.put(`/users/${userId}`, {
          actor_user_id: userId,
          phone_number: formValues.phone_number || "",
          freelance_category: formValues.freelance_category || "",
        }).catch(() => {/* non-critical */});
        localStorage.removeItem("googleAuth");
      }

      localStorage.setItem(`profileSetupComplete:${userId}`, "true");
      window.location.href = role === "company" ? "/home/employer" : "/home/freelancer";
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        e.response?.data?.message || e.message || "Could not save profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const progress = Math.round(
    ((currentQ + (allAnswered ? 1 : 0)) / totalSteps) * 100,
  );

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Profile Setup</p>
            <p className="text-xs text-gray-400">
              {role === "company" ? "Employer" : "Freelancer"} ·{" "}
              {currentQ + (allAnswered ? 1 : 0)} of {totalSteps} questions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {aiAvailable === false && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              AI offline — using guided questions
            </div>
          )}
          <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 w-8 text-right">
            {progress}%
          </span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full p-4 sm:p-6 gap-4 lg:gap-6 min-h-0">
        {/* Chat panel */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-0">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Bot className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-gray-800">
              AI Setup Assistant
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-gray-50 border border-gray-200 text-gray-800"
                      : "bg-red-600 text-white"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                  }}
                />
              </div>
            ))}
            {/* Confirmation bubble */}
            {pendingConfirm && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-gray-50 border border-gray-200 text-gray-800">
                  <p className="mb-2">
                    Got it! Saving <strong>{pendingConfirm.value || "(empty)"}</strong> — is that correct?
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                      onClick={confirmAnswer}
                    >
                      Yes, confirm
                    </button>
                    <button
                      className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
                      onClick={editAnswer}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              className="input text-sm"
              placeholder={
                pendingConfirm
                  ? "Confirm above or click Edit to retype"
                  : allAnswered
                  ? "All questions answered — complete setup →"
                  : questions[currentQ]
                  ? `${questions[currentQ].label}: ${questions[currentQ].hint}`
                  : "Type your answer..."
              }
              value={input}
              disabled={allAnswered || !!pendingConfirm}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !allAnswered && !pendingConfirm) sendMessage();
              }}
            />
            <button
              className="btn px-4 flex items-center gap-1.5 shrink-0"
              onClick={sendMessage}
              disabled={allAnswered || !input.trim() || !!pendingConfirm}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile preview panel */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex-1">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              {role === "company" ? "Employer Profile" : "Freelancer Profile"}
            </h2>

            <div className="space-y-3">
              {questions.map((q, idx) => {
                const val = formValues[q.key] || "";
                const answered = !!val;
                const isCurrent = idx === currentQ && !allAnswered;
                return (
                  <div
                    key={q.key}
                    className={`rounded-xl border p-3 transition-all ${isCurrent ? "border-red-300 bg-red-50" : answered ? "border-emerald-200 bg-emerald-50" : "border-gray-100 bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {answered ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${isCurrent ? "border-red-400" : "border-gray-300"}`}
                        />
                      )}
                      <label className="text-xs font-medium text-gray-600">
                        {q.label}
                      </label>
                    </div>
                    <input
                      className={`w-full text-xs bg-transparent outline-none text-gray-800 placeholder-gray-400 ${answered ? "" : "text-gray-400"}`}
                      placeholder={q.hint}
                      value={val}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          [q.key]: e.target.value,
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* CV upload — freelancers only, optional */}
          {role === "freelancer" && (
            <div
              className={`rounded-xl border p-3 transition-all ${cvUploaded ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {cvUploaded ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                )}
                <span className="text-xs font-medium text-gray-600">
                  CV / Resume{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </span>
              </div>
              {cvUploaded ? (
                <p className="text-xs text-emerald-600">
                  {cvFile?.name} — uploaded ✓
                </p>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-blue-600 underline underline-offset-2">
                    {cvUploading ? "Uploading…" : "Choose PDF / DOC"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    disabled={cvUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadCv(f);
                    }}
                  />
                </label>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Complete button */}
          <button
            className={`btn w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              allAnswered ? "opacity-100" : "opacity-50 cursor-not-allowed"
            }`}
            onClick={completeSetup}
            disabled={!allAnswered || saving}
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Complete Setup
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            Answer all {totalSteps} questions to unlock the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
